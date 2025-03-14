import requests
import json
from datetime import datetime, timedelta
from collections import defaultdict


# Fetch NHL schedule data from Sportsdata.io
def fetch_nhl_schedule():
    api_key = (
        "e8babb013d104d41bf1e3bab9a2d7a2e"  # Replace with your Sportsdata.io API key
    )
    season = 2025
    url = f"https://api.sportsdata.io/v3/nhl/scores/json/SchedulesBasic/{season}?key={api_key}"
    response = requests.get(url)

    # Write the raw JSON response to a file
    with open("raw.json", "w") as file:
        json.dump(response.json(), file, indent=4)

    return response.json()


# Organize schedule by week
def organize_schedule_by_week(schedule):
    games_by_week = defaultdict(lambda: defaultdict(list))

    for game in schedule:
        date_str = game["Day"]
        date = datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S")
        week_start = date - timedelta(days=date.weekday())  # Monday of the current week

        home_team = game["HomeTeam"]
        away_team = game["AwayTeam"]
        games_by_week[week_start][home_team].append(away_team)
        games_by_week[week_start][away_team].append(home_team)

    return games_by_week


# Display the organized schedule
def display_schedule(games_by_week):
    for week_start, teams in sorted(games_by_week.items()):
        print(f"Week starting on {week_start.strftime('%Y-%m-%d')}:")
        for team, opponents in teams.items():
            print(
                f"  {team} plays {len(opponents)} games against: {', '.join(opponents)}"
            )
        print()


# Main function
def main():
    schedule = fetch_nhl_schedule()
    # print(schedule)
    games_by_week = organize_schedule_by_week(schedule)
    display_schedule(games_by_week)


if __name__ == "__main__":
    main()
