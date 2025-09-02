const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      const validationError = new Error(`Validation failed: ${errorMessage}`);
      validationError.statusCode = 422;
      validationError.code = 'VALIDATION_ERROR';
      validationError.details = error.details;
      return next(validationError);
    }

    // Replace the request data with validated data
    req[source] = value;
    next();
  };
};

module.exports = {
  validateRequest
};
