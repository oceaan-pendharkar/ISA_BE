export const SECRET_KEY = "RvDb1Nab4sdhNEFhtOYnMBxQRW1x44MZshXCCd9DuAQ="; // secret key

export const authenticateUser = (req, res, next) => {
  const token = req.cookies.authToken; // Get token from cookie

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // Attach user info to request
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid token" });
  }
};
