import { Handler } from '@netlify/functions';
import { Client } from 'pg';

export const handler: Handler = async (event) => {
    const dbUrl = process.env.NETLIFY_DATABASE_URL;
  
    if (!dbUrl) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Variável de conexão com o banco não encontrada' }),
      };
    }
  
    const client = new Client({
      connectionString: dbUrl,
      ssl: {
        rejectUnauthorized: false,
      },
    });

  try {
    await client.connect();

    // 🔥 MÁGICA AQUI: Cria a tabela automaticamente se for a primeira vez!
    // Usamos VARCHAR na data para aceitar o formato "16/08/2026" do seu React
    await client.query(`
      CREATE TABLE IF NOT EXISTS rotina_passeios (
        data_registro VARCHAR(20) PRIMARY KEY,
        tutor VARCHAR(50),
        p1 VARCHAR(20),
        p2 VARCHAR(20),
        p3 VARCHAR(20),
        p4 VARCHAR(20),
        observacoes TEXT
      );
    `);

    // 🟢 ROTA GET: Busca o histórico para montar a tabela
    if (event.httpMethod === 'GET') {
      const result = await client.query(`
        SELECT * FROM rotina_passeios 
        ORDER BY TO_DATE(data_registro, 'DD/MM/YYYY') DESC 
        LIMIT 5;
      `);
      await client.end();

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.rows),
      };
    }

    // 🔴 ROTA POST: Salva ou atualiza a rotina
    if (event.httpMethod === 'POST') {
      const payload = JSON.parse(event.body || '{}');
      const { data, tutor, p1, p2, p3, p4, obs } = payload;

      const query = `
        INSERT INTO rotina_passeios (data_registro, tutor, p1, p2, p3, p4, observacoes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (data_registro) 
        DO UPDATE SET tutor = $2, p1 = $3, p2 = $4, p3 = $5, p4 = $6, observacoes = $7;
      `;

      await client.query(query, [data, tutor, p1, p2, p3, p4, obs]);
      await client.end();

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Salvo com sucesso no banco!' }),
      };
    }

    await client.end();
    return { statusCode: 405, body: 'Método não permitido' };
  } catch (error) {
    console.error('Erro no banco:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Erro de comunicação com o banco' }),
    };
  }
};