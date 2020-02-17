"use strict"
$(function() {

    $("#queryForm").submit(function(e) {
        e.preventDefault();
        var sampleQuery = { "WHERE": { "IS": { "rooms_name": "DMP_*" } }, "OPTIONS": { "COLUMNS": [ "rooms_name" ], "ORDER": "rooms_name", "FORM": "TABLE" } }

        $.ajax({
            url: 'http://localhost:4321/query',
            type: 'post',
            data: JSON.stringify(sampleQuery),
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                console.log(data);
                generateTable(data.result)
            },
            error: function (err) {
                console.log(Object.keys(err));
            }

        })
    })

    function generateTable(data) {
        var tbl_body = document.createElement("tbody");
        var odd_even = false;
        console.log("DATA", data);
        $.each(data, function() {
            var tbl_row = tbl_body.insertRow();
            tbl_row.className = odd_even ? "odd" : "even";
            $.each(this, function(k , v) {
                var cell = tbl_row.insertCell();
                cell.appendChild(document.createTextNode(v.toString()));
            })
            odd_even = !odd_even;
        })
        document.getElementById("tblResults").appendChild(tbl_body);
        // $("#tblResults").appendChild(tbl_body);
    }


})