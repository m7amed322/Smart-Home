module.exports =  {
    wrapper:(fn) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      throw (error);
    }
  };
},
}

