// https://barnsleymbc.moderngov.co.uk/mgMemberIndex.aspx?VW=TABLE&PIC=1&FN=ALPHA
var COUNCILLORS = $('#mgTable1').find('tr.mgTableOddRow, tr.mgTableEvenRow');
var WARDS = {};
COUNCILLORS.each((idx, row) => {
    var cells = $(row).find('td');
    var name = $(cells[1]).find('p')[0].innerText.replace(/Councillor /, '');
    var party = cells[2].innerText;
    var ward = cells[3].innerText.replace(' and ', ' & ').toUpperCase();
    console.log(ward, party, name);
    if (!WARDS[ward]) {
        WARDS[ward] = {
            seats: []
        };
    }
    WARDS[ward].seats.push({
        name: name,
        party: party
    });
});
console.log(JSON.stringify(WARDS));