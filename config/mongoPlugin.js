// config/mongoPlugin.js
import mongoose from 'mongoose';

function getOpName(key) {
  if (typeof key === 'symbol') {
    return key.description || String(key).slice(7, -1);
  }
  return String(key);
}

export function translateWhere(where) {
  if (!where || typeof where !== 'object') return where || {};
  const out = {};

  for (const key of Reflect.ownKeys(where)) {
    const val = where[key];
    const keyName = getOpName(key);

    if (keyName === 'or') {
      out['$or'] = (Array.isArray(val) ? val : [val]).map(translateWhere);
      continue;
    }
    if (keyName === 'and') {
      out['$and'] = (Array.isArray(val) ? val : [val]).map(translateWhere);
      continue;
    }

    let mongoKey = (key === 'id' || keyName === 'id') ? '_id' : keyName;
    if (mongoKey === 'ownerId') {
      mongoKey = 'owner';
    }

    if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date) && !(val instanceof RegExp) && !(val instanceof mongoose.Types.ObjectId)) {
      const innerObj = {};
      let hasCustomOp = false;

      for (const opKey of Reflect.ownKeys(val)) {
        const opVal = val[opKey];
        const opName = getOpName(opKey);

        if (opName === 'like' || opName === 'iLike') {
          hasCustomOp = true;
          const str = String(opVal).replace(/^%+|%+$/g, '');
          innerObj['$regex'] = str;
          innerObj['$options'] = 'i';
        } else if (opName === 'gte') {
          hasCustomOp = true;
          innerObj['$gte'] = opVal;
        } else if (opName === 'lte') {
          hasCustomOp = true;
          innerObj['$lte'] = opVal;
        } else if (opName === 'gt') {
          hasCustomOp = true;
          innerObj['$gt'] = opVal;
        } else if (opName === 'lt') {
          hasCustomOp = true;
          innerObj['$lt'] = opVal;
        } else if (opName === 'ne') {
          hasCustomOp = true;
          innerObj['$ne'] = opVal;
        } else if (opName === 'in') {
          hasCustomOp = true;
          innerObj['$in'] = Array.isArray(opVal) ? opVal : [opVal];
        } else {
          innerObj[opName] = opVal;
        }
      }
      out[mongoKey] = hasCustomOp ? innerObj : val;
    } else {
      out[mongoKey] = val;
    }
  }

  return out;
}

export function parseOrder(order) {
  if (!order) return { createdAt: -1 };
  if (typeof order === 'string') return order;
  if (Array.isArray(order)) {
    const sort = {};
    for (const item of order) {
      if (Array.isArray(item)) {
        const field = item[0] === 'id' ? '_id' : item[0];
        const dir = String(item[1]).toUpperCase() === 'DESC' ? -1 : 1;
        sort[field] = dir;
      }
    }
    return Object.keys(sort).length ? sort : { createdAt: -1 };
  }
  return order;
}

export function applyMongoPlugin(schema) {
  // Ensure id virtual is available and returned in JSON
  schema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id ? ret._id.toString() : ret.id;
      return ret;
    },
  });

  schema.set('toObject', {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id ? ret._id.toString() : ret.id;
      return ret;
    },
  });

  // Query middleware to seamlessly handle Sequelize { where: { ... } }
  schema.pre(['find', 'findOne', 'countDocuments', 'deleteMany', 'deleteOne'], function () {
    const filter = this.getQuery();
    if (filter && typeof filter === 'object' && 'where' in filter) {
      this.setQuery(translateWhere(filter.where));
    }
  });

  // Instance methods
  schema.methods.update = async function (data) {
    Object.assign(this, data);
    return this.save();
  };

  schema.methods.destroy = async function () {
    return this.deleteOne();
  };

  // Static methods
  schema.statics.findByPk = async function (id, options = {}) {
    if (!id) return null;
    let query = this.findById(id);

    if (options.attributes?.exclude) {
      const exclusions = options.attributes.exclude.map((f) => `-${f}`).join(' ');
      query = query.select(exclusions);
    }

    if (options.include) {
      for (const inc of options.include) {
        if (inc.as) {
          const select = inc.attributes ? inc.attributes.join(' ') : '';
          query = query.populate(inc.as, select);
        }
      }
    }

    return query.exec();
  };

  schema.statics.findAndCountAll = async function (options = {}) {
    const filter = translateWhere(options.where);
    const limit = Number(options.limit) || 20;
    const offset = Number(options.offset) || 0;
    const sort = parseOrder(options.order);

    let query = this.find(filter).sort(sort).skip(offset).limit(limit);

    if (options.attributes?.exclude) {
      const exclusions = options.attributes.exclude.map((f) => `-${f}`).join(' ');
      query = query.select(exclusions);
    }

    if (options.include) {
      for (const inc of options.include) {
        if (inc.as) {
          const select = inc.attributes ? inc.attributes.join(' ') : '';
          query = query.populate(inc.as, select);
        }
      }
    }

    const [rows, count] = await Promise.all([
      query.exec(),
      this.countDocuments(filter),
    ]);

    return { rows, count };
  };

  schema.statics.findAll = async function (options = {}) {
    const filter = translateWhere(options.where);
    const sort = parseOrder(options.order);

    let query = this.find(filter).sort(sort);

    if (options.limit) query = query.limit(Number(options.limit));
    if (options.offset) query = query.skip(Number(options.offset));

    if (options.attributes?.exclude) {
      const exclusions = options.attributes.exclude.map((f) => `-${f}`).join(' ');
      query = query.select(exclusions);
    }

    if (options.include) {
      for (const inc of options.include) {
        if (inc.as) {
          const select = inc.attributes ? inc.attributes.join(' ') : '';
          query = query.populate(inc.as, select);
        }
      }
    }

    return query.exec();
  };

  schema.statics.count = async function (options = {}) {
    if (options && typeof options === 'object' && 'where' in options) {
      return this.countDocuments(translateWhere(options.where));
    }
    return this.countDocuments(options || {});
  };

  schema.statics.destroy = async function (options = {}) {
    if (options && typeof options === 'object' && 'where' in options) {
      return this.deleteMany(translateWhere(options.where));
    }
    return this.deleteMany(options || {});
  };
}
