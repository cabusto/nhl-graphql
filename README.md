# NHL GraphQL API

This project provides a GraphQL API for accessing NHL data.

## Getting Started
### Creating a Virtual Environment
It is recommended to use a virtual environment to manage dependencies. You can create one using `venv`:

1. Create the virtual environment:
    ```bash
    python -m venv venv
    ```

2. Activate the virtual environment:
    - On macOS/Linux:
        ```bash
        source venv/bin/activate
        ```
    - On Windows:
        ```bash
        venv\Scripts\activate
        ```

3. Once activated, you can install the required dependencies as described in the Installation section.
### Prerequisites
- Python 3.12 or higher
- `pip` (Python package manager)

### Installation
1. Clone the repository:
    ```bash
    git clone https://github.com/your-username/nhl-graphql.git
    cd nhl-graphql
    ```

2. Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

## Running the Python Script
1. Navigate to the `scripts` folder:
    ```bash
    cd scripts
    ```

2. Run the Python script:
    ```bash
    python fetch_schedule.py
    ```
    This will generate `raw.json` for the GraphQL server

## Running the GraphQL API
### Installing npm Packages
Before starting the API server, ensure that all required npm packages are installed. Run the following command in the `nhl-graphql-api` directory:

```bash
npm install
```

### Starting the API Server
1. Start the API server using npm:
    ```bash
    npm start
    ```

2. Access the GraphQL playground in your browser at:
    ```
    http://localhost:4000/graphql
    ```

2. Access the GraphQL playground in your browser at:
    ```
    http://localhost:4000/graphql
    ```


## Sample Queries
### Sample Queries

Here are some examples of how to call queries in the GraphQL server:

#### Fetch Team Information
To fetch information about a specific team, use the following query:
```graphql
query GetTeam($name: String!) {
    team(name: $name) {
        TeamID
        Name
    }
}
```

**Variables:**
```json
{
    "name": "Boston Bruins"
}
```

#### Fetch Player Statistics
To retrieve statistics for a specific player, use this query:
```graphql
query GetPlayerStats($id: ID!) {
    player(id: $id) {
        id
        fullName
        stats {
            season
            goals
            assists
            points
        }
    }
}
```
**Variables:**
```json
{
    "id": "8478402"
}
```

#### Fetch Game Schedule
To get the schedule of games for a specific date, use the following query:
```graphql
query GetSchedule($date: String!) {
    schedule(date: $date) {
        games {
            gamePk
            teams {
                home {
                    team {
                        name
                    }
                }
                away {
                    team {
                        name
                    }
                }
            }
            status {
                detailedState
            }
        }
    }
}
```
**Variables:**
```json
{
    "date": "2023-10-15"
}
```

#### Fetch Standings
To retrieve the current league standings, use this query:
```graphql
query GetStandings {
    standings {
        division {
            name
        }
        teamRecords {
            team {
                name
            }
            points
            wins
            losses
        }
    }
}
```

#### Fetch Weekly Game Count
To get the number of games played by each team in a specific week, use the following query:
```graphql
query WeeklyGameCount($weekNumber: Int!, $year: Int) {
    weeklyGameCount(weekNumber: $weekNumber, year: $year) {
        teamName
        gameCount
    }
}
```
**Variables:**
```json
{
    "weekNumber": 10,
    "year": 2024
}
```

These queries can be executed in the GraphQL playground at `http://localhost:4000/graphql`.

## License
This project is licensed under the MIT License.