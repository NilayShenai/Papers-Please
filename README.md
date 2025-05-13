# Papers, Please

**Papers, Please** is a fast, filterable archive for MIT Manipal question papers, built with Next.js App Router, TypeScript, and Tailwind CSS. It supports dynamic filtering, fast search, server-side pagination, and exposes a clean API for integration.

Now available on Docker Hub:
[https://hub.docker.com/r/nilayshenai/papers-please](https://hub.docker.com/r/nilayshenai/papers-please)

Access the site here:
[https://papers.000196.xyz/](https://papers.000196.xyz/)

---

## Features

* Dynamic filtering with interdependent dropdowns (Year, Programme, Term, Semester, Branch)
* Full-text search on paper name and subject
* Server-side pagination
* Sorts by Year > Programme > Term > Semester > Branch
* Clean UI using Tailwind and ShadCN
* All data is loaded from a single JSON file at `data/all_papers.json`
* Fully containerized with Docker

---

## Images

![Demo UI](https://github.com/NilayShenai/Papers-Please/blob/main/imgs/image.png)

---

## API Endpoints

### GET `/api/papers`

Fetches a paginated, filtered list of papers.

**Query Parameters:**

* `year`, `programme`, `term`, `semester`, `branch`: filters (optional)
* `search`: string to match against name or subject (optional)
* `page`: current page number (default: 1)
* `pageSize`: results per page (default: 24, max: 100)

**Example:**

```
/api/papers?year=2022&programme=B.Tech&term=June%202022&search=datastructures&page=1&pageSize=25
```

**Response:**

```json
{
  "total": 12,
  "page": 1,
  "pageSize": 25,
  "totalPages": 1,
  "results": [
    {
      "path": ["2022", "June 2022", "IV Sem", "CSE"],
      "name": "Data Structures.pdf",
      "url": "...",
      "year": "2022",
      "term": "June 2022",
      "programme": "B.Tech",
      "semester": "IV Sem",
      "branch": "CSE",
      "subject": "Data Structures",
      "id": "paper-91"
    }
  ]
}
```

---

### GET `/api/filter-options`

Returns valid values for a given filter level, based on the currently selected filters.

**Query Parameters:**

* `level`: one of `year`, `programme`, `term`, `semester`, `branch` (required)
* other filters (`year`, `programme`, etc.) as context

**Example:**

```
/api/filter-options?level=term&year=2022&programme=B.Tech
```

**Response:**

```json
{
  "options": ["June 2022", "Dec 2022 / Jan 2023"]
}
```

---

## Running Locally

### Install

```bash
pnpm install
# or npm install
```

### Start Dev Server

```bash
pnpm dev
# or npm run dev
```

Visit `http://localhost:3000`

---

## Run with Docker

### Pull Image

```bash
docker pull nilayshenai/papers-please
```

### Run

```bash
docker run -p 3000:3000 nilayshenai/papers-please
```

Access at `http://localhost:3000`
