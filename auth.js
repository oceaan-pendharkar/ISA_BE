import jwt from "jsonwebtoken";

export const authenticateUser = (req, res, next) => {
  let decoded;
  try{
    const usertoken = req.headers.cookie;
    const token = usertoken.split(' ');
    decoded = jwt.verify(token[0].split('=')[1], process.env.SECRET_KEY);
  } catch (err){
    return res.status(401).send('unauthorized');
  }

  req.user = decoded;

  next();
};
