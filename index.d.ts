declare module 'inhousen-auth' {
    export default class AuthLibrary {
      constructor(dbInstance: any, options?: any);
  
      register(userData: any): Promise<any>;
      login(credentials: any): Promise<any>;
      generatePublicKey(): Promise<any>;
      encryptPassword(password: string): Promise<any>;
    }
  }