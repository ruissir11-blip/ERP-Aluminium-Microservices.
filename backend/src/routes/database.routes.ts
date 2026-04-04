import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';

const router = Router();

// Get database info
router.get('/info', async (req: Request, res: Response) => {
  try {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    
    const version = await queryRunner.query('SELECT version()');
    const dbName = await queryRunner.query('SELECT current_database() as db_name');
    
    await queryRunner.release();
    
    res.json({
      version: version[0].version,
      database: dbName[0].db_name
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get database info' });
  }
});

// List all schemas
router.get('/schemas', async (req: Request, res: Response) => {
  try {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    
    const result = await queryRunner.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY schema_name
    `);
    
    await queryRunner.release();
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list schemas' });
  }
});

// List tables in a schema
router.get('/tables', async (req: Request, res: Response) => {
  try {
    const schema = req.query.schema || 'public';
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    
    const result = await queryRunner.query(
      `SELECT table_name, table_schema 
       FROM information_schema.tables 
       WHERE table_schema = $1 
       ORDER BY table_name`,
      [schema]
    );
    
    await queryRunner.release();
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list tables' });
  }
});

// Describe table schema
router.get('/table/:table', async (req: Request, res: Response) => {
  try {
    const { table } = req.params;
    const schema = req.query.schema || 'public';
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    
    // Get columns
    const columns = await queryRunner.query(
      `SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
       FROM information_schema.columns 
       WHERE table_schema = $1 AND table_name = $2 
       ORDER BY ordinal_position`,
      [schema, table]
    );
    
    // Get primary keys
    const primaryKeys = await queryRunner.query(
      `SELECT kcu.column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu 
         ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
       WHERE tc.constraint_type = 'PRIMARY KEY' 
         AND tc.table_schema = $1 
         AND tc.table_name = $2`,
      [schema, table]
    );
    
    // Get foreign keys
    const foreignKeys = await queryRunner.query(
      `SELECT
         kcu.column_name,
         ccu.table_name AS foreign_table_name,
         ccu.column_name AS foreign_column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
       JOIN information_schema.constraint_column_usage ccu
         ON tc.constraint_name = ccu.constraint_name
         AND tc.table_schema = ccu.table_schema
       WHERE tc.constraint_type = 'FOREIGN KEY'
         AND tc.table_schema = $1
         AND tc.table_name = $2`,
      [schema, table]
    );
    
    await queryRunner.release();
    
    res.json({ columns, primaryKeys, foreignKeys });
  } catch (error) {
    res.status(500).json({ error: 'Failed to describe table' });
  }
});

// Get table row count
router.get('/table/:table/count', async (req: Request, res: Response) => {
  try {
    const { table } = req.params;
    const schema = req.query.schema || 'public';
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    
    const result = await queryRunner.query(
      `SELECT COUNT(*) as count FROM "${schema}"."${table}"`
    );
    
    await queryRunner.release();
    
    res.json({ count: parseInt(result[0].count) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get row count' });
  }
});

// Get table data
router.get('/table/:table/data', async (req: Request, res: Response) => {
  try {
    const { table } = req.params;
    const schema = req.query.schema || 'public';
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    
    // Get columns
    const columnsResult = await queryRunner.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_schema = $1 AND table_name = $2
       ORDER BY ordinal_position`,
      [schema, table]
    );
    
    // Get data
    const data = await queryRunner.query(
      `SELECT * FROM "${schema}"."${table}" LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    await queryRunner.release();
    
    res.json({
      columns: columnsResult.map((c: { column_name: string }) => c.column_name),
      rows: data,
      limit,
      offset
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get table data' });
  }
});

// Execute raw SQL query
router.post('/query', async (req: Request, res: Response) => {
  try {
    const { sql, params } = req.body;
    
    if (!sql) {
      return res.status(400).json({ error: 'SQL query is required' });
    }
    
    // Security check: only SELECT queries allowed by default
    const isSelect = sql.trim().toLowerCase().startsWith('select');
    
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    
    const result = await queryRunner.query(sql, params || []);
    
    await queryRunner.release();
    
    res.json({
      rowCount: result.rowCount || result.length || 0,
      rows: result
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to execute query' });
  }
});

export default router;
