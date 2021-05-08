(function () {
var mymap = L.map('mapid').setView([53.455, -1.528494], 11);
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data © <a href="http://openstreetmap.org" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/" target="_blank" rel="noreferrer">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com" target="_blank" rel="noreferrer">Mapbox</a>, Boundary data © <a href="https://www.ordnancesurvey.co.uk/election-maps/gb/?x=441165&y=398063&z=4&bnd1=MTW&bnd2=&labels=off" target="_blank" rel="noreferrer">OS</a>, Result data © <a href="https://candidates.democracyclub.org.uk/" target="_blank" rel="noreferrer">Democracy Club</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/" target="_blank" rel="noreferrer">CC-BY-SA</a></p>',
    maxZoom: 18,
    id: 'mapbox/light-v10',
    accessToken: 'pk.eyJ1IjoiandoZWFyZSIsImEiOiJjamdydW1zcDgwZWN4MnhzMzljdnltdTRzIn0.BTVyxizdqNGPnj8UaC1IOQ'
}).addTo(mymap);

var WARDS = {};
RESULTS.forEach(function (res) {
    res.ballot_paper_id
    res.candidate_results.forEach(function (cand) {
        var wardUpper = cand.membership.post.label.toUpperCase();
        if (!WARDS[wardUpper]) {
            WARDS[wardUpper] = {
                election: cand.membership.election,
                post: cand.membership.post,
                results: [],
                turnout: res.turnout_percentage,
                ballot_paper_id: res.ballot_paper_id
            }
        }
        WARDS[wardUpper].results.push(cand);
        if (cand.is_winner) {
            WARDS[wardUpper].winner = cand;
        }
    });
});

var colors = {
    'Liberal Democrats': 'orange',
    'Labour': '#f55',
    'Labour Party': '#f55',
    'Labour and Co-operative Party': '#f55',
    'Labour and Co-operative': '#f55',
    'Conservative': '#33f',
    'Conservative and Unionist Party': '#33f',
    'Conservative and Unionist': '#33f',
    'Green Party': '#3a3',
    'UKIP': 'purple',
    'UK Independence Party (UKIP)': 'purple',
    'UK Independence Party': 'purple'
};
var text_colors = {
    'Labour': '#fff',
    'Labour Party': '#fff',
    'Labour and Co-operative Party': '#fff',
    'Labour and Co-operative': '#fff',
    'Conservative': '#fff',
    'Conservative and Unionist Party': '#fff',
    'Conservative and Unionist': '#fff',
    'Green Party': '#fff',
    'UKIP': '#fff',
    'UK Independence Party (UKIP)': '#fff',
    'UK Independence Party': '#fff'
};

function safe(text) {
    return String(text || '').replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

L.geoJSON(BOUNDARIES, {
    filter: function (feature) {
        return /, (SHEFFIELD)|(BARNSLEY) DISTRICT$/.test(feature.properties.fullname);
    },
    style: function (feature) {
        var ward = WARDS[feature.properties.name];
        var color = 'grey';
        var fillOpacity = 0.01;
        var weight = 0.5;
        if (ward && ward.winner) {
            color = colors[ward.winner.membership.on_behalf_of.name] || 'grey';
            fillOpacity = 0.4;
            weight = 2;
        }
        return {
            weight: weight,
            color: color,
            fillOpacity: fillOpacity,
            fillColor: color
        };
    },
    onEachFeature: function (feature, layer) {
        var ward = WARDS[feature.properties.name];
        var tt = '';
        if (ward) {
            if (ward.turnout) {
                tt += '<div class="results__turnout">'
                tt += 'turnout: ' + safe(ward.turnout) + '%';
                tt += '</div>';
            }

            tt += '<h2 class="results__head">';
            tt += safe(ward.post.label);
            tt += ' - ';
            tt += safe(ward.election.name.replace(/ local election$/, ''));
            tt += '</h2>';

            tt += '<table class="results__table" cellspacing="0" cellpadding="5">'
            tt += '<tr>'
            tt += '<th>Candidate</th>'
            tt += '<th>Party</th>'
            tt += '<th>Votes</th>'
            tt += '</tr>'

            ward.results.forEach(function (res) {
                var bg = colors[res.membership.on_behalf_of.name] || 'grey';
                var color = text_colors[res.membership.on_behalf_of.name] || 'black';

                tt += '<tr'
                if (res.is_winner) {
                    tt += ' class="results__winner"';
                    tt += ' style="background: ' + bg + '; color: ' + color + '"';
                } else {
                    tt += ' style="color: ' + bg + '"';
                }
                tt += '>';
                tt += '<td class="result__candidate">' + safe(res.membership.person.name) + '</td>'
                tt += '<td class="result__party">' + safe(res.membership.on_behalf_of.name) + '</td>'
                tt += '<td class="result__votes">' + safe(res.num_ballots) + '</td>'
                tt += '</tr>'
            });

            tt += '</table>'

            if (window.COUNCILLORS) {
                var council = COUNCILLORS[feature.properties.name];
                if (council) {
                    tt += '<hr>';
                    tt += '<h3>Previous Council makeup</h3>';
                    tt += '<div class="results__incumbents">';
                    council.seats.forEach((seat) => {
                        var inc_bg = colors[seat.party] || 'grey';
                        tt += '<p>';
                        tt += '<span class="results__incumbent" style="background: ' + inc_bg + '" title="' + safe(seat.party) + ': ' + safe(seat.name) + '">';
                        tt += '</span>';
                        tt += safe(seat.party) + ': ' + safe(seat.name);
                        tt += '</p>'
                    });
                    tt += '</div>';
                } else {
                    // console.log(feature.properties.name);
                }
            }
        } else {
            tt += safe(feature.properties.fullname);
        }
        layer.bindTooltip(tt);
    }
}).addTo(mymap);
})();