export const create = async ({ model, data } = {}) => {
  return await model.create(data);
};

export const find = async ({ model, filter = {}, options = {} }) => {
  return await model.find(filter, options);
};

export const findOne = async ({
  model,
  filter = {},
  populate = [],
  select = "",
} = {}) => {
  return await model.findOne(filter).populate(populate).select(select);
};

export const findById = async ({
  model,
  filter = {},
  populate = [],
  select = "",
} = {}) => {
  return await model.findById(filter).populate(populate).select(select);
};

export const deleteMany = async ({ model, filter = {} } = {}) => {
  return await model.deleteMany(filter);
};

export const findOneAndUpdate = async ({
  model,
  filter = {},
  update = {},
  options = {},
} = {}) => {
  return await model.findOneAndUpdate(filter, update, options);
};
