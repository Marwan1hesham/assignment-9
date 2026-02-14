export const successResponce = ({
  res,
  message = "done",
  status = 200,
  data = undefined,
} = {}) => {
  return res.status(status).json({ message, data });
};
