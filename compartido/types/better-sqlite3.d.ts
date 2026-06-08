declare module "better-sqlite3" {
  export interface Statement<BindParameters = unknown, Result = unknown> {
    run(params?: BindParameters): unknown;
    get(params?: BindParameters): Result;
  }

  export interface Database {
    pragma(source: string): unknown;
    exec(source: string): this;
    prepare<BindParameters = unknown, Result = unknown>(
      source: string,
    ): Statement<BindParameters, Result>;
  }

  const BetterSqlite3: {
    new (filename: string): Database;
  };

  export default BetterSqlite3;
}
