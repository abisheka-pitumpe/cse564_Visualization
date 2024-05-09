from flask import Flask, render_template, jsonify, request
import pandas as pd
from sklearn.manifold import MDS
import numpy as np
app = Flask(__name__)

# df = pd.read_csv('static/whr_data/imputed_dataset_with_coords.csv')

df = pd.read_csv('static/whr_data/normalized_data.csv')
df = df.dropna()
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/years')
def get_years():
    years = ['Select Year'] + list(range(2024, 2014, -1))  # Years from 2024 to 2015
    return {'years': list(years)}

@app.route('/countries')
def get_countries():
    countries = ['Select Country'] + sorted(df['Country'].unique())
    return {'countries': list(countries)}

@app.route('/regions')
def get_regions():
    regions = ['Select Region'] + sorted(df['Region'].unique())
    return {'regions': list(regions)}

@app.route('/countries_by_region')
def get_countries_by_region():
    region_selected = request.args.get('region')

    if region_selected:
        filtered_df = df[df['Region'] == region_selected]
    else:
        filtered_df = df

    # Convert the filtered DataFrame to a list of dictionaries
    countries = filtered_df.to_dict(orient='records')

    # Filter the list of dictionaries based on the 'Year' key
    countries_filtered = [country for country in countries if country['Year'] == 2024]

    # Return the filtered list of countries as JSON
    return jsonify(countries_filtered)



# Function to filter data based on year
def filter_data_by_year(year):
    return df[df['Year'] == year]

# Endpoint to get data for a specific year
@app.route('/data', methods=['GET'])
def get_data():
    year = request.args.get('year', default=2024, type=int)  # Default to 2024 if no year provided
    filtered_data = filter_data_by_year(year)
    return jsonify(filtered_data.to_dict(orient='records'))

@app.route('/get_country_region_year')
def get_country_region_year():
    selected_country = request.args.get('country')
    selected_region = request.args.get('region')
    selected_year = request.args.get('year')
    
    filtered_data = df.copy()
    
    if selected_country:
        filtered_data = filtered_data[filtered_data['Country'] == selected_country]
    elif selected_region:
        filtered_data = filtered_data[filtered_data['Region'] == selected_region]
    elif selected_year:
        filtered_data = filtered_data[filtered_data['Year'] == int(selected_year)]
    
    return jsonify(filtered_data.to_dict(orient='records'))

@app.route('/pcp_data')
def pcp_data():
    df= pd.read_csv('static/whr_data/pcp_data.csv')

    year = request.args.get('year', default=2024, type=int)  # Default to 2024 if no year provided
    filtered_data = df[df['Year'] == year]
    # Assuming df is a global variable or defined elsewhere
    data = filtered_data[['Country', 'Region', 'Happiness Rank', 'Ladder score', 'Economy',
               'Social support', 'Health', 'Freedom', 'Trust', 'Generosity',
               'Dystopia Residual']].to_dict(orient='records')
    return jsonify(data)

@app.route('/bar_chart_data', methods=['GET'])
def get_bar_chart_data():
    year = request.args.get('year', default=2024, type=int)
    filtered_data = df[df['Year'] == year][['Country', 'Region', 'Ladder score','Economy','Social support','Health','Freedom','Trust','Generosity']]
    return jsonify(filtered_data.to_dict(orient='records'))

@app.route("/update_bar_chart_by_region", methods=["GET"])
def update_bar_chart_by_region():
    selected_region = request.args.get("region")
    filtered_data = df[df['Region'] == selected_region][['Country', 'Region', 'Ladder score','Economy','Social support','Health','Freedom','Trust','Generosity']]
    return jsonify(filtered_data.to_dict(orient='records'))

@app.route("/update_bar_chart_by_country", methods=["GET"])
def update_bar_chart_by_country():
    selected_country = request.args.get("country")
    filtered_data = df[df['Country'] == selected_country][['Country', 'Region', 'Ladder score','Economy','Social support','Health','Freedom','Trust','Generosity']]
    return jsonify(filtered_data.to_dict(orient='records'))

@app.route('/update_pcpdata/<region>', methods=['GET'])
def update_data(region):
    formatted_data = {}
    df= pd.read_csv('static/whr_data/pcp_data.csv')
    for entry in df:
        if entry["Region"] == region:
            country = entry["Country"]
            if region not in formatted_data:
                formatted_data[region] = []
            formatted_data[region].append(country)

    return jsonify(formatted_data)

@app.route('/get_linedata')
def get_linedata():
    # Calculate the average Ladder score per Year for each Region
    avg_scores = df.groupby(['Region', 'Year'])['Ladder score'].mean().reset_index()
    return jsonify(avg_scores.to_dict(orient='records'))


@app.route('/get_lineregion', methods=['GET'])
def get_lineregion():
    country = request.args.get('country')
    entry = df[df['Country'] == country]
    if not entry.empty:
        region = entry['Region'].iloc[0]  # Get the region from the first entry (assuming there is only one)
        return jsonify({"region": region})
    else:
        return jsonify({"error": "Region not found for country: {}".format(country)}), 404



@app.route('/get_ladder_scores')
def get_ladder_scores():
    # Process the data to get the desired format
    ladder_scores = df.set_index('Country')['Ladder score'].to_dict() 
    return jsonify(ladder_scores)

@app.route('/get_country_region_map')
def get_country_region_map():
    country_region_map = {}
    for index, row in df.iterrows():
        country_region_map[row['Country']] = row['Region']

    return jsonify(country_region_map)
if __name__ == '__main__':
    app.run(debug=True, port=8970)



