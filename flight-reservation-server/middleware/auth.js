const authMiddleware = {
    // Check if user is logged in
    isAuthenticated: (req, res, next) => {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }
        next();
    },

    // Check if user is admin
    isAdmin: (req, res, next) => {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }
        next();
    },

    // Check if user is customer
    isCustomer: (req, res, next) => {
        if (!req.session.user || req.session.user.role !== 'customer') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Customers only.'
            });
        }
        next();
    },

    // Check if user owns the resource
    isResourceOwner: (model) => {
        return async (req, res, next) => {
            try {
                const resource = await model.findById(req.params.id);
                if (!resource) {
                    return res.status(404).json({
                        success: false,
                        message: 'Resource not found'
                    });
                }

                if (resource.userId.toString() !== req.session.user._id.toString() && 
                    req.session.user.role !== 'admin') {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied'
                    });
                }
                next();
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        };
    }
};

module.exports = authMiddleware;