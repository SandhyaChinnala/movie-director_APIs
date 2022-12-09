const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "moviesData.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDBServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error : ${error.message}`);
    process.exit(1);
  }
};
initializeDBServer();

const convertDbObjToResponseObj = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

//API 1 -- Returns a list of all movie names in the movie table
app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
        SELECT * FROM movie
        ORDER BY movie_id;
    `;
  const moviesArray = await db.all(getMoviesQuery);
  response.send(
    moviesArray.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

//API 2 -- Creates a new movie in the movie table. movie_id is auto-incremented

app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const addMovieQuery = `
        INSERT INTO movie
        (director_id, movie_name, lead_actor)
        VALUES
        (
            ${directorId},
            '${movieName}',
            '${leadActor}'
        );
    `;
  const dbResponse = await db.run(addMovieQuery);
  response.send("Movie Successfully Added");
});

//API 3 -- Returns a movie based on the movie ID
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
        SELECT * FROM movie
        WHERE movie_id = ${movieId};
        `;
  const movie = await db.get(getMovieQuery);
  response.send(convertDbObjToResponseObj(movie));
});

//API 4 -- Updates the details of a movie in the movie table based on the movie ID
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const updateMovieQuery = `
        UPDATE movie
        SET
            director_id = ${directorId},
            movie_name = '${movieName}',
            lead_actor = '${leadActor}'
        WHERE 
            movie_id = ${movieId};
    `;
  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

//API 5 -- Deletes a movie from the movie table based on the movie ID
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
        DELETE FROM movie
        WHERE 
            movie_id = ${movieId};
    `;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

const convertToResponseObj = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

//API 6 -- Returns a list of all directors in the director table
app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `
        SELECT * FROM director
        ORDER BY director_id;
    `;
  const directorsArray = await db.all(getDirectorsQuery);
  response.send(
    directorsArray.map((eachDirector) => convertToResponseObj(eachDirector))
  );
});

// const convert = (dbObject) => {
//   return {
//     movieName: dbObject.movie_name,
//   };
// };

//API 7 -- Returns a list of all movie names directed by a specific director
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const movieByDirectorQuery = `
        SELECT movie_name
        FROM movie
        WHERE movie.director_id = ${directorId};
    `;
  const movieNamesArray = await db.all(movieByDirectorQuery);
  response.send(
    movieNamesArray.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

module.exports = app;
