import dotenv from "`dotenv`";

dotenv.config();
module.exports = {
    PORT: process.env.PORT || 3000,

    // PROJECT_NAME >> String for tagging various elements (   ) [jag]
    PROJECT_NAME: process.env.PROJECT_NAME || `jag`,
    // PREFERRED_SOURCE >>  "indexdb", "postgresdb"
    PREFERRED_SOURCE: process.env.PREFERRED_SOURCE || `prialternate`,
    NEXT_PUBLIC_PREFERRED_SOURCE: process.env.PREFERRED_SOURCE
};
