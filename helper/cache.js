import Memcached from "memcached";

// Connect to Memcached server (default port is 11211)
const memcached = new Memcached('localhost:11211');

// Set cache helper functions
const cache = {
  set: (key, value, lifetime = 300) => {
    memcached.set(key, value, lifetime, (err) => {
      if (err) console.error('Memcached Set Error:', err);
    });
  },
  get: (key) => {
    return new Promise((resolve, reject) => {
      memcached.get(key, (err, data) => {
        if (err) reject(err);
        resolve(data);
      });
    });
  },
  del: (key) => {
    memcached.del(key, (err) => {
      if (err) console.error('Memcached Delete Error:', err);
    });
  },
};

export default cache
