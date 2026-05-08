import { Handler } from "@netlify/functions";

export const handler: Handler = async (event, context) => {
  // Handle CORS preflight
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: "Method Not Allowed",
    };
  }

  try {
    const { username, password } = JSON.parse(event.body || "{}");

    // Exact check requested by user
    if (username === "karim" && password === "karimdoha@123") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          token: "valid-token", 
          message: "Login success" 
        }),
      };
    } else {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Invalid credentials" }),
      };
    }
  } catch (err) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid request body" }),
    };
  }
};
