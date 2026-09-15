import jwt from "jsonwebtoken";
import fs from "fs";
import User from "../models/User.js";
import Admin from "../models/Admin.js";

const debugLog = (payload) => {
  const body = {
    sessionId: "52e297",
    timestamp: Date.now(),
    ...payload,
  };
  // #region agent log
  fetch("http://127.0.0.1:7723/ingest/9d726cc0-c183-4148-b159-dad9c9ba60e7", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "52e297",
    },
    body: JSON.stringify(body),
  }).catch(() => {});
  try {
    fs.appendFileSync(
      "d:\\2026\\Mantaence\\.cursor\\debug-52e297.log",
      JSON.stringify(body) + "\n"
    );
  } catch {
    /* ignore debug file errors */
  }
  // #endregion
};

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;

  if (typeof authHeader === "string" && authHeader.trim()) {
    const value = authHeader.trim();
    const bearerMatch = value.match(/^Bearer\s+(.+)$/i);
    if (bearerMatch?.[1]) {
      return bearerMatch[1].trim();
    }
  }

  return req.cookies?.token || null;
};

export const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};


export const protect = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    // #region agent log
    debugLog({
      runId: "post-fix",
      hypothesisId: "A-E",
      location: "auth.middleware.js:protect",
      message: "protect token lookup",
      data: {
        method: req.method,
        url: req.originalUrl,
        hasAuthorization: Boolean(req.headers.authorization),
        authorizationPrefix: req.headers.authorization
          ? String(req.headers.authorization).slice(0, 7)
          : null,
        hasCookieHeader: Boolean(req.headers.cookie),
        hasCookieToken: Boolean(req.cookies?.token),
        hasXAccessToken: Boolean(req.headers["x-access-token"]),
        hasXAuthToken: Boolean(req.headers["x-auth-token"]),
        hasTokenHeader: Boolean(req.headers.token),
        hasBodyToken: Boolean(req.body?.token),
        authRelatedHeaderKeys: Object.keys(req.headers).filter((key) =>
          /auth|token|cookie/i.test(key)
        ),
        tokenSource: /^Bearer\s+/i.test(String(req.headers.authorization || ""))
          ? "authorization-bearer"
          : req.cookies?.token
            ? "cookie"
            : "none",
        tokenFound: Boolean(token),
      },
    });
    // #endregion

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Not authorized. No token provided. Login via POST /api/auth/login, then send Authorization: Bearer <token> (or reuse the token cookie from that login).",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    let user;

    // ADMIN
    if (decoded.role === "admin") {
      user = await Admin.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Admin not found.",
        });
      }

      req.user = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: "admin",
        isActive: user.isActive,
      };
    }

    // RESIDENT / SECURITY / SECRETARY
    else {
      user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found.",
        });
      }

      req.user = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      };
    }

    // ACTIVE CHECK
    if (req.user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive.",
      });
    }

    next();

  } catch (error) {
    console.error("Auth Middleware Error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

export const adminOnly = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login.",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    next();
  } catch (error) {
    console.error("Admin Middleware Error:", error);

    return res.status(500).json({
      success: false,
      message: "Authorization check failed.",
    });
  }
};

// export const adminOnly = (req, res, next) => {
//   if (!req.user) {
//     return res.status(401).json({
//       success: false,
//       message: "Authentication required.",
//     });
//   }

//   if (req.user.role !== "admin") {
//     return res.status(403).json({
//       success: false,
//       message: "Admin access required.",
//     });
//   }

//   next();
// };