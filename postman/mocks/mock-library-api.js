const http = require("http");
const { URL } = require("url");
const { randomUUID } = require("crypto");

// In-memory book store seeded with sample data
let books = [
  {
    id: "29f47d22-1062-479d-be58-2d8db3ecb8be",
    title: "Ficciones",
    author: "Jorge Luis Borges",
    genre: "fiction",
    yearPublished: 1944,
    checkedOut: false,
    isPermanentCollection: true,
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: "7f04875b-9201-4c8f-b381-18370f9b2dfb",
    title: "One Hundred Years of Solitude",
    author: "Gabriel García Márquez",
    genre: "fiction",
    yearPublished: 1967,
    checkedOut: false,
    isPermanentCollection: true,
    createdAt: "2024-01-02T00:00:00.000Z"
  },
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    title: "The Four Agreements",
    author: "don Miguel Ruiz",
    genre: "self-help",
    yearPublished: 1997,
    checkedOut: true,
    isPermanentCollection: false,
    createdAt: "2024-06-15T10:30:00.000Z"
  }
];

const API_KEY = "postmanrulz";

function jsonResponse(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => { data += chunk; });
    req.on("end", () => {
      if (!data) return resolve(null);
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        resolve(data);
      }
    });
    req.on("error", reject);
  });
}

function checkApiKey(req) {
  return req.headers["api-key"] === API_KEY;
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();
  const segments = pathname.split("/").filter(Boolean);

  // @endpoint GET /
  if (method === "GET" && pathname === "/") {
    return jsonResponse(res, 200, { message: "Welcome to the Postman Library API" });
  }

  // @endpoint GET /books
  if (method === "GET" && pathname === "/books") {
    let result = [...books];
    const genre = parsedUrl.searchParams.get("genre");
    const checkedOut = parsedUrl.searchParams.get("checkedOut");
    const search = parsedUrl.searchParams.get("search");

    if (genre) {
      result = result.filter((b) => b.genre.toLowerCase() === genre.toLowerCase());
    }
    if (checkedOut !== null && checkedOut !== undefined && checkedOut !== "") {
      const isCheckedOut = checkedOut === "true";
      result = result.filter((b) => b.checkedOut === isCheckedOut);
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(s) ||
          b.author.toLowerCase().includes(s)
      );
    }
    return jsonResponse(res, 200, result);
  }

  // @endpoint POST /books
  if (method === "POST" && pathname === "/books") {
    if (!checkApiKey(req)) {
      return jsonResponse(res, 403, {
        error: { code: 403, message: "Forbidden: Invalid or missing API key" }
      });
    }
    const body = await parseBody(req);
    const newBook = {
      id: randomUUID(),
      title: (body && body.title) || "Untitled",
      author: (body && body.author) || "Unknown",
      genre: (body && body.genre) || "unknown",
      yearPublished: (body && body.yearPublished) || 2024,
      checkedOut: false,
      isPermanentCollection: false,
      createdAt: new Date().toISOString(),
      ...body,
      id: randomUUID(),
      checkedOut: false,
      isPermanentCollection: false,
      createdAt: new Date().toISOString()
    };
    books.push(newBook);
    return jsonResponse(res, 201, newBook);
  }

  // @endpoint GET /books/:id
  if (method === "GET" && segments[0] === "books" && segments.length === 2) {
    const bookId = segments[1];
    const book = books.find((b) => b.id === bookId);
    if (!book) {
      return jsonResponse(res, 404, {
        error: { code: 404, message: "The book you are searching for cannot be found." }
      });
    }
    return jsonResponse(res, 200, book);
  }

  // @endpoint PATCH /books/:id
  if (method === "PATCH" && segments[0] === "books" && segments.length === 2) {
    if (!checkApiKey(req)) {
      return jsonResponse(res, 403, {
        error: { code: 403, message: "Forbidden: Invalid or missing API key" }
      });
    }
    const bookId = segments[1];
    const index = books.findIndex((b) => b.id === bookId);
    if (index === -1) {
      return jsonResponse(res, 404, {
        error: { code: 404, message: "The book you are searching for cannot be found." }
      });
    }
    const body = await parseBody(req);
    if (body && typeof body === "object") {
      books[index] = { ...books[index], ...body, id: books[index].id };
    }
    return jsonResponse(res, 200, books[index]);
  }

  // @endpoint DELETE /books/:id
  if (method === "DELETE" && segments[0] === "books" && segments.length === 2) {
    if (!checkApiKey(req)) {
      return jsonResponse(res, 403, {
        error: { code: 403, message: "Forbidden: Invalid or missing API key" }
      });
    }
    const bookId = segments[1];
    const index = books.findIndex((b) => b.id === bookId);
    if (index === -1) {
      return jsonResponse(res, 404, {
        error: { code: 404, message: "The book you are searching for cannot be found." }
      });
    }
    books.splice(index, 1);
    res.writeHead(204);
    return res.end();
  }

  // @endpoint GET /get
  if (method === "GET" && pathname === "/get") {
    const echoHeaders = {};
    for (const [key, value] of Object.entries(req.headers)) {
      echoHeaders[key] = value;
    }
    return jsonResponse(res, 200, {
      headers: echoHeaders,
      url: req.url
    });
  }

  // @endpoint POST /post
  if (method === "POST" && pathname === "/post") {
    const body = await parseBody(req);
    const echoHeaders = {};
    for (const [key, value] of Object.entries(req.headers)) {
      echoHeaders[key] = value;
    }
    return jsonResponse(res, 200, {
      data: body,
      headers: echoHeaders,
      url: req.url
    });
  }

  // 404 fallback for unmatched routes
  jsonResponse(res, 404, { error: { code: 404, message: "Route not found" } });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Library API Mock server running on port ${PORT}`);
});
