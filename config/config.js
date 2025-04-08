class Config {
  constructor(dbInstance, options, s3Data) {
    this.DB_INSTANCE = dbInstance;
    this.JWT_SECRET = options.jwt_secret;
    this.TABLE_NAME = options.lookuptable;
    this.MEM_CACHE_URL = options.mem_cache_host || null;
    this.S3_DATA = s3Data;
    this.REDIS_INSTANCE = options.redis_host || null;
    this.VALIDATION_API = options?.validation_api || null;
  }

  async getJwtSecret() {
    return this.JWT_SECRET;
  }

  async getS3Credentials() {
    return this.S3_DATA;
  }
  getDBInstance() {
    return this.DB_INSTANCE;
  }
  getOptions() {
    return this.options;
  }
  getMemCacheClient() {
    return this.MEM_CACHE_URL;
  }
  getRedisHost() {
    return this.REDIS_INSTANCE;
  }
  getValidationAPI(){
    return this.VALIDATION_API;
  }
}
export default Config;
