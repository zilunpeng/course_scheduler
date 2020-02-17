"use strict"
$(function () {
    $("#queryForm").submit(function (e) {
        e.preventDefault();
        var dept_to_search = $('#dept-name').val();
        var year_to_search = $('#year').val();

        if (dept_to_search != '' && year_to_search == '') {
            var getCoursesQuery = {
                "WHERE": {
                    "AND": [{"IS": {"courses_dept": dept_to_search}},
                        {"GT": {"courses_year": 1900}}]
                },
                "OPTIONS": {
                    "COLUMNS": ["courses_dept", "courses_id", "courses_avg", "courses_year"],
                    "ORDER": "courses_avg",
                    "FORM": "TABLE"
                }
            }
        }

        if (year_to_search != '' && dept_to_search == '') {
            var getCoursesQuery = {
                "WHERE": {
                    "AND": [{"EQ": {"courses_year": Number(year_to_search)}},
                        {"GT": {"courses_year": 1900}}]
                },
                "OPTIONS": {
                    "COLUMNS": ["courses_dept", "courses_id", "courses_avg", "courses_year"],
                    "ORDER": "courses_avg",
                    "FORM": "TABLE"
                }
            }
        }

        if (year_to_search != '' && dept_to_search != '') {
            var getCoursesQuery = {
                "WHERE": {
                    "AND": [{"IS": {"courses_dept": dept_to_search}}, {
                        "EQ": {"courses_year": Number(year_to_search)}}, {
                        "GT": {"courses_year": 1900}
                    }]
                },
                "OPTIONS": {
                    "COLUMNS": ["courses_dept", "courses_id", "courses_avg", "courses_year"],
                    "ORDER": "courses_avg",
                    "FORM": "TABLE"
                }
            }
        }

        $.ajax({
            url: 'http://localhost:4321/query',
            type: 'post',
            data: JSON.stringify(getCoursesQuery),
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                display_data(data.result);
            },
            error: function (err) {
                alert(err['responseText'])
            }
        })

    })

    function display_data(data) {
        $('#tblResults').empty();
        var tbl_body = document.createElement("tbody");
        var odd_even = false;
        var ind = data.length-1;
        while (ind != 0) {
            var tbl_row = tbl_body.insertRow();
            tbl_row.className = odd_even ? "odd" : "even";
            var cell = tbl_row.insertCell();
            var cse = data[ind];
            cell.appendChild(document.createTextNode(data[ind]['courses_dept'] + data[ind]['courses_id'] + " : "+data[ind]['courses_avg'] + ' in ' + data[ind]['courses_year']));
            odd_even = !odd_even;
            ind--;
        }
        document.getElementById("tblResults").appendChild(tbl_body);
    }

})