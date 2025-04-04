class Config {
  constructor(dbInstance, options, s3Data) {
    this.DB_INSTANCE = dbInstance;
    this.JWT_SECRET = options.jwt_secret;
    this.TABLE_NAME = options.lookuptable;
    this.MEM_CACHE_URL = options.mem_cache_host;
    this.S3_DATA = s3Data;
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
}
export default Config;
