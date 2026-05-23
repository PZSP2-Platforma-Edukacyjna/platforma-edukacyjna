declare module "js-cookie" {
  type CookieSameSite = "strict" | "Strict" | "lax" | "Lax" | "none" | "None";

  type CookieAttributes = {
    expires?: number | Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: CookieSameSite;
  };

  type CookiesStatic = {
    get(name: string): string | undefined;
    set(name: string, value: string, options?: CookieAttributes): string | undefined;
    remove(name: string, options?: CookieAttributes): void;
  };

  const Cookies: CookiesStatic;
  export default Cookies;
}
