(function () {
var mymap = L.map('mapid').setView([53.48, -1.34], 11);
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
        var regionUpper = normaliseElection(cand.membership.election.name).toUpperCase() + ' DISTRICT';
        var wardUpperFull = wardUpper + ', ' + regionUpper;
        if (!WARDS[wardUpperFull]) {
            WARDS[wardUpperFull] = {
                election: cand.membership.election,
                post: cand.membership.post,
                results: [],
                turnout: res.turnout_percentage,
                ballot_paper_id: res.ballot_paper_id,
                winners: []
            }
        }
        WARDS[wardUpperFull].results.push(cand);
        if (cand.is_winner) {
            WARDS[wardUpperFull].winners.push(cand);
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

function normaliseName(name) {
    return name.replace(/ [MCO]BE$/, '')
        .replace(/ BEM$/, '')
        .replace(/ JP$/, '')
        .replace(/^Sir /, '');
}

function normaliseElection(name) {
    return name.replace(/( local election)|( metropolitan borough council)$/i, '');
}

L.geoJSON(BOUNDARIES, {
    filter: function (feature) {
        return /, (SHEFFIELD)|(BARNSLEY)|(DONCASTER)|(ROTHERHAM) DISTRICT$/.test(feature.properties.fullname);
    },
    style: function (feature) {
        var ward = WARDS[feature.properties.fullname];
        var color = 'grey';
        var fillOpacity = 0.01;
        var weight = 0.5;
        var pattern;
        if (ward && ward.winners) {
            var partyVotes = {};
            ward.winners.forEach(c => {
                var cp = c.membership.on_behalf_of.name;
                if (!partyVotes[cp]) {
                    partyVotes[cp] = 0;
                }
                partyVotes[cp] += c.num_ballots;
            });
            var partyWinner, partyRunnerUp;
            for (p in partyVotes) {
                if (partyWinner && partyVotes[partyWinner] >= partyVotes[p]) {
                    continue;
                }
                if (partyWinner) {
                    partyRunnerUp = partyWinner;
                }
                partyWinner = p;
            }
            if (Object.keys(partyVotes).length > 1 && partyRunnerUp) {
                console.log(partyVotes, feature.properties.fullname, partyRunnerUp, colors[partyRunnerUp] || 'grey');
                pattern = new L.StripePattern({
                    color: colors[partyWinner] || 'grey',
                    spaceColor: colors[partyRunnerUp] || 'grey',
                    opacity: 1,
                    spaceOpacity: 1
                });
                pattern.addTo(mymap);
            }
            color = colors[partyWinner] || 'grey';
            fillOpacity = 0.4;
            weight = 2;
        }
        var ret = {
            weight: weight,
            color: color,
            fillOpacity: fillOpacity
        };
        if (pattern) {
            ret.fillPattern = pattern;
        } else {
            ret.color = color;
        }
        return ret;
    },
    onEachFeature: function (feature, layer) {
        var ward = WARDS[feature.properties.fullname];
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
            tt += safe(normaliseElection(ward.election.name));
            tt += '</h2>';

            tt += '<table class="results__table" cellspacing="0" cellpadding="5">'
            tt += '<tr>'
            tt += '<th>Candidate</th>'
            tt += '<th>Party</th>'
            tt += '<th>Votes</th>'
            tt += '</tr>'

            var winners = {};
            var losers = {};
            ward.results.forEach(function (res) {
                var rp = res.membership.on_behalf_of.name;
                var bg = colors[rp] || 'grey';
                var color = text_colors[rp] || 'black';

                tt += '<tr'
                if (res.is_winner) {
                    winners[res.membership.person.name] = true;
                    tt += ' class="results__winner"';
                    tt += ' style="background: ' + bg + '; color: ' + color + '"';
                } else {
                    losers[res.membership.person.name] = true;
                    tt += ' style="color: ' + bg + '"';
                }
                tt += '>';
                tt += '<td class="result__candidate">' + safe(res.membership.person.name) + '</td>'
                tt += '<td class="result__party">' + safe(rp) + '</td>'
                tt += '<td class="result__votes">' + safe(res.num_ballots) + '</td>'
                tt += '</tr>'
            });

            tt += '</table>'

            if (window.COUNCILLORS) {
                var council = COUNCILLORS[feature.properties.fullname];
                if (council) {
                    tt += '<hr>';
                    tt += '<h3>Previous Council makeup</h3>';
                    tt += '<div class="results__incumbents">';
                    var holdOrLoss = false;
                    council.seats.forEach((seat) => {
                        var inc_bg = colors[seat.party] || 'grey';
                        tt += '<p>';
                        tt += '<span class="results__incumbent" style="background: ' + inc_bg + '" title="' + safe(seat.party) + ': ' + safe(seat.name) + '">';
                        tt += '</span>';
                        tt += safe(seat.party) + ': ' + safe(seat.name);
                        var normName = normaliseName(seat.name);
                        if (winners[normName]) {
                            tt += ' <b>(hold)</b>';
                            holdOrLoss = true;
                        }
                        if (losers[normName]) {
                            tt += ' <b>(lost)</b>';
                            holdOrLoss = true;
                        }
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