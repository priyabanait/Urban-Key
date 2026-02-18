// Authentication bypass: attach a default admin-like user to every request
// This removes JWT/token checks and role enforcement. Intended when the
// project owner requests no authentication. Use with caution.
export const authenticate = async (req, res, next) => {
  try {
    // If a client provides minimal user info via header, respect it; otherwise attach default admin
    const headerUser = req.headers['x-mock-user'] || req.headers['x-mockuser'];
    if (headerUser) {
      try {
        req.user = typeof headerUser === 'string' ? JSON.parse(headerUser) : headerUser;
        return next();
      } catch (err) {
        // ignore and fallthrough to default user
      }
    }

    // Default user: admin-like with a societyId used across the app
    req.user = {
      id: 'admin',
      role: 'admin',
      type: 'admin',
      mobile: null,
      name: 'Admin',
      societyId: process.env.DEFAULT_SOCIETY_ID || '69901e38e4343ed761e92c81'
    };
    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication bypass error',
      error: error.message
    });
  }
};

// No-op authorize: allow all roles
export const authorize = (...roles) => (req, res, next) => next();


