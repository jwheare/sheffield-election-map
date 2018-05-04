(function () {
var mymap = L.map('mapid').setView([53.381129, -1.470085], 11);
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org" target="_blank">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com" target="_blank">Mapbox</a>, Boundary data © <a href="https://www.ordnancesurvey.co.uk/election-maps/gb/?x=440717&y=386411&z=5&bnd1=&bnd2=MTW&labels=off" target="_blank">OS</a>, Result data © <a href="https://candidates.democracyclub.org.uk/election/local.sheffield.2018-05-03/constituencies" target="_blank">Democracy Club</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a></p>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1IjoiandoZWFyZSIsImEiOiJjamdydW1zcDgwZWN4MnhzMzljdnltdTRzIn0.BTVyxizdqNGPnj8UaC1IOQ'
}).addTo(mymap);

var wards = {};
RESULTS.forEach(function (res) {
    res.ballot_paper_id
    res.candidate_results.forEach(function (cand) {
        var wardUpper = cand.membership.post.label.toUpperCase();
        if (!wards[wardUpper]) {
            wards[wardUpper] = {
                post: cand.membership.post,
                results: [],
                turnout: res.num_turnout_reported,
                ballot_paper_id: res.ballot_paper_id
            }
        }
        wards[wardUpper].results.push(cand);
        if (cand.is_winner) {
            wards[wardUpper].winner = cand;
        }
    });
});

var colors = {
    'party:90': 'orange',
    'party:53': '#f55',
    'joint-party:53-119': '#f55',
    'party:52': '#33f',
    'party:63': '#3a3',
    'party:85': 'purple'
};
var text_colors = {
    'party:53': '#fff',
    'joint-party:53-119': '#fff',
    'party:52': '#fff',
    'party:63': '#fff',
    'party:85': '#fff'
};

function safe(text) {
    return String(text || '').replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

L.geoJSON(BOUNDARIES, {
    filter: function (feature) {
        return feature.properties.fullname.indexOf(', SHEFFIELD DISTRICT') !== -1;
    },
    style: function (feature) {
        var ward = wards[feature.properties.name];
        var color;
        if (ward && ward.winner) {
            color = colors[ward.winner.membership.on_behalf_of.id] || 'grey';
        }
        return {
            color: color,
            fillColor: color,
            fillOpacity: 0.4
        };
    },
    onEachFeature: function (feature, layer) {
        var ward = wards[feature.properties.name];
        if (ward) {
            var tt = '';
            if (ward.turnout) {
                tt += '<div class="results__turnout">'
                tt += 'turnout: ' + safe(ward.turnout) + '%';
                tt += '</div>';
            }

            tt += '<h2 class="results__head">';
            tt += safe(ward.post.label);
            tt += '</h2>';

            tt += '<table class="results__table" cellspacing="0" cellpadding="5">'
            tt += '<tr>'
            tt += '<th>Candidate</th>'
            tt += '<th>Party</th>'
            tt += '<th>Votes</th>'
            tt += '</tr>'

            ward.results.forEach(function (res) {
                var bg = colors[res.membership.on_behalf_of.id] || 'grey';
                var color = text_colors[res.membership.on_behalf_of.id] || 'black';

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

            layer.bindTooltip(tt);
        }
    }
}).addTo(mymap);
})();