export const create = async ({ model, data } = {}) => {
  return await model.create(data);
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
