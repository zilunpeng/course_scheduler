"use strict"
$(function () {
    var available_rooms;
    var courses_to_schedule;
    var times = ['MWF8', 'MWF9', 'MWF10', 'MWF11', 'MWF12', 'MWF13', 'MWF14', 'MWF15', 'MWF16', 'TT8', 'TT930', 'TT11', 'TT1330', 'TT15'];

    $("#queryForm").submit(function (e) {
        e.preventDefault();
        var dept_to_schedule = $('#department').val();
        var cid_to_schedule = $('#course-number').val();
        var course_dropDown = $('#course_dropdown').val();

        if (dept_to_schedule != '' && cid_to_schedule == '') {
            var getCoursesQuery = {
                "WHERE": {
                    "AND": [{"IS": {"courses_dept": dept_to_schedule}},
                        {"GT": {"courses_year": 1900}}]
                },
                "OPTIONS": {
                    "COLUMNS": ["courses_dept", "courses_id", "courses_pass", "courses_fail", "courses_year"],
                    "FORM": "TABLE"
                }
            }
        }

        if (cid_to_schedule != '' && dept_to_schedule == '') {
            var getCoursesQuery = {
                "WHERE": {
                    "AND": [{"IS": {"courses_id": cid_to_schedule}}, {
                        "GT": {"courses_year": 1900}
                    }]
                },
                "OPTIONS": {
                    "COLUMNS": ["courses_dept", "courses_id", "courses_pass", "courses_fail", "courses_year"],
                    "FORM": "TABLE"
                }
            }
        }

        if (cid_to_schedule != '' && dept_to_schedule != '' && course_dropDown == 'and') {
            var getCoursesQuery = {
                "WHERE": {
                    "AND": [{"IS": {"courses_id": cid_to_schedule}}, {
                        "IS": {"courses_dept": dept_to_schedule}
                    }, {
                        "GT": {"courses_year": 1900}
                    }]
                },
                "OPTIONS": {
                    "COLUMNS": ["courses_dept", "courses_id", "courses_pass", "courses_fail", "courses_year"],
                    "FORM": "TABLE"
                }
            }
        }

        if (cid_to_schedule != '' && dept_to_schedule != '' && course_dropDown == 'or') {
            var getCoursesQuery = {
                "WHERE": {
                    "AND": [{
                        "OR": [{"IS": {"courses_id": cid_to_schedule}}, {
                            "IS": {"courses_dept": dept_to_schedule}
                        }]
                    }, {
                        "GT": {"courses_year": 1900}
                    }]
                },
                "OPTIONS": {
                    "COLUMNS": ["courses_dept", "courses_id", "courses_pass", "courses_fail", "courses_year"],
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
                parseSections(data.result)
            },
            error: function (err) {
                alert(err)
            }
        })
    })

    function parseSections(sections) {
        courses_to_schedule = {};
        for (var i = 0; i < sections.length; i++) { //group sections by courses_dept+courses_id
            var sectionId = sections[i]['courses_dept'] + sections[i]['courses_id'];
            if (courses_to_schedule[sectionId] == undefined) {
                courses_to_schedule[sectionId] = [sections[i]];
            } else if (courses_to_schedule[sectionId] != undefined) {
                courses_to_schedule[sectionId].push(sections[i]);
            }
        }

        var courses_dept_id = Object.keys(courses_to_schedule);
        for (var i = 0; i < courses_dept_id.length; i++) {
            var maxPPl = 0;
            var num_sec_2014 = 0;
            var group = courses_to_schedule[courses_dept_id[i]];
            for (var j = 0; j < group.length; j++) {
                var cur_sec = group[j];
                var sec_j_ppl = cur_sec['courses_pass'] + cur_sec['courses_fail'];
                if (sec_j_ppl > maxPPl) {
                    maxPPl = sec_j_ppl;
                }
                if (cur_sec['courses_year'] == 2014) {
                    num_sec_2014++;
                }
            }
            if (num_sec_2014>0) {
                courses_to_schedule[courses_dept_id[i]] = {'num_ppl': maxPPl, 'num_sec': Math.ceil((num_sec_2014+1) / 3)}; //+1 for overall???!!!
            } else {
                delete courses_to_schedule[courses_dept_id[i]];
            }
        }

        getRooms();
    }

    function getRooms() {
        var getAllRmsQuery = {"WHERE": {},
            "OPTIONS": {
                "COLUMNS": ["rooms_shortname", "rooms_number", "rooms_lat", "rooms_lon", "rooms_seats", "rooms_fullname"],
                "FORM": "TABLE"
            }
        };
        $.ajax({
            url: 'http://localhost:4321/query',
            type: 'post',
            data: JSON.stringify(getAllRmsQuery),
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                parseRooms(data.result)
            },
            error: function (err) {
                alert(err)
            }
        })
    }

    function parseRooms(rooms) {
        available_rooms = [];
        var b_to_sche = $('#building-name').val();
        var sche_within_b_ = $('#another-building-name').val();
        var dist = Number($('#dist').val());
        var b_dropdown = $('#building_dropdown').val();

        var within_b_latlon = getLatLon(sche_within_b_, rooms);

        for (var i = 0; i < rooms.length; i++) {
            var cur_room = rooms[i];
            if (b_to_sche != '' && (sche_within_b_ == '' || dist == '')) {
                if (cur_room['rooms_shortname'] == b_to_sche) {
                    available_rooms.push(cur_room);
                }
            } else if (b_to_sche != '' && sche_within_b_ != '' && dist != '' && b_dropdown == 'and') {
                if (cur_room['rooms_shortname'] == b_to_sche && withinDist(cur_room, within_b_latlon['lat'], within_b_latlon['lon'], dist)) {
                    available_rooms.push(cur_room);
                }

            } else if (b_to_sche != '' && sche_within_b_ != '' && dist != '' && b_dropdown == 'or') {
                if (cur_room['rooms_shortname'] == b_to_sche || withinDist(cur_room, within_b_latlon['lat'], within_b_latlon['lon'], dist)) {
                    available_rooms.push(cur_room);
                }
            }
        }

        schedule();
    }

    var cap_mat, res_mat, flow_mat, max_f_val, node_names;
    var courseInd, roomsInd, timesInd, connectorInd, tInd;
    var num_courses, num_rooms, num_t_slots, num_connector, num_nodes;

    function schedule() {
        build_flow_net();
        EdmondsKarp();
        var schedule = get_schedule();
        display_results(schedule);
        calc_q_msre();
    }

    function build_flow_net() {
        num_courses = Object.keys(courses_to_schedule).length;
        num_rooms = available_rooms.length;
        num_t_slots = times.length;
        num_connector = num_courses;
        num_nodes = num_courses + num_rooms + num_t_slots + num_connector + 2; // + source + sink + connector between courses and times

        courseInd = 1;
        roomsInd = num_courses + 1;
        timesInd = num_courses + num_rooms + 1;
        connectorInd = num_courses + num_rooms + num_t_slots + 1;
        tInd = num_nodes - 1;

        cap_mat = new Array(num_nodes);
        res_mat = new Array(num_nodes);
        flow_mat = new Array(num_nodes);
        node_names = new Array(num_nodes);
        max_f_val = 0;

        node_names.push(courses_to_schedule);
        node_names.push(available_rooms);
        node_names.push(times);

        for (var i = 0; i < num_nodes; i++) {
            cap_mat[i] = new Array(num_nodes).fill(0);
            res_mat[i] = new Array(num_nodes).fill(0);
            flow_mat[i] = new Array(num_nodes).fill(0);
            if (i == 0) { //source
                for (var j = 0; j < num_rooms; j++) {
                    cap_mat[i][roomsInd + j] = num_t_slots;
                    res_mat[i][roomsInd + j] = num_t_slots;
                }
            } else if (i >= courseInd && i < roomsInd) { //courses
                    var c_ind = i-courseInd;
                    var courseId = Object.keys(courses_to_schedule)[c_ind];
                    var course = courses_to_schedule[courseId];
                    cap_mat[i][connectorInd+c_ind] = course['num_sec'];
                    res_mat[i][connectorInd+c_ind] = course['num_sec'];
            } else if (i >= roomsInd && i < timesInd) { //rooms
                var room = available_rooms[i-roomsInd];
                var j = 0;
                for (var courseId in courses_to_schedule) {
                    if (room['rooms_seats'] >= courses_to_schedule[courseId]['num_ppl']) {
                        // cap_mat[i][courseInd + j] = courses_to_schedule[courseId]['num_sec'];
                        // res_mat[i][courseInd + j] = courses_to_schedule[courseId]['num_sec'];
                        cap_mat[i][courseInd + j] = num_t_slots;
                        res_mat[i][courseInd + j] = num_t_slots;
                    }
                    j++;
                }
            } else if (i >= timesInd && i < connectorInd) { //times
                cap_mat[i][tInd] = num_rooms;
                res_mat[i][tInd] = num_rooms;
            } else if (i >= connectorInd && i < tInd) {
                for (var j = 0; j < num_t_slots; j++) {
                    cap_mat[i][timesInd + j] = 1;
                    res_mat[i][timesInd + j] = 1;
                }
            }
        }
    }

    function EdmondsKarp() {
        while (true) {
            var minResPath = bfs();
            var minRes = minResPath['minRes'];
            var path = minResPath['path'];
            if (minRes == 0) {
                break
            }
            max_f_val += minRes;
            var v = tInd;
            while (v != 0) { //v != s
                var u = path[v];
                flow_mat[u][v] += minRes;
                flow_mat[v][u] -= minRes;
                res_mat[u][v] -= minRes;
                res_mat[v][u] += minRes;
                v = u;
            }
        }
    }

    function bfs() {
        var path = new Array(num_nodes).fill(-1);
        var M = new Array(num_nodes).fill(0);
        path[0] = -2;
        M[0] = Infinity;
        var queue = [];
        queue.unshift(0);
        while (queue.length > 0) {
            var u = queue.pop();
            var neighbors = getNeighbors(u);
            for (var i = 0; i < neighbors.length; i++) {
                var v = neighbors[i];
                if (res_mat[u][v] > 0 && path[v] == -1) {
                    path[v] = u;
                    M[v] = Math.min(M[u], cap_mat[u][v] - flow_mat[u][v]);
                    if (v != num_nodes - 1) {
                        queue.unshift(v);
                    } else {
                        return {'minRes': M[num_nodes - 1], 'path': path};
                    }
                }
            }
        }
        return {'minRes': 0, 'path': path};
    }

    function get_schedule() {
        var rms_scheduled = get_scheduled_rms();
        var rms_cls_scheduled = get_scheduled_cls(rms_scheduled);
        var rms_cls_tms_scheduled = get_scheduled_tms(rms_cls_scheduled);
        return rms_cls_tms_scheduled;
    }

    //Return a list of room indicies that are scheduled with classes
    function get_scheduled_rms() {
        var rms_scheduled = [];
        var i=0
        while (i<num_rooms) {
            if (flow_mat[0][roomsInd+i] > 0) {
                rms_scheduled.push(i);
            }
            i++;
        }
        return rms_scheduled;
    }

    //Return an object, key is room ind and value is an array of class inds if the class is scheduled in that room
    function get_scheduled_cls(rms_scheduled) {
        var rms_cls_schedule = {};
        for (var i=0; i<rms_scheduled.length; i++) {
            var rm_ind = rms_scheduled[i];
            rms_cls_schedule[rm_ind] = [];
            for (var j=0; j<num_courses; j++) {
                var num_cls_in_rm = flow_mat[roomsInd+rm_ind][courseInd+j];
                if (num_cls_in_rm > 0) {
                    rms_cls_schedule[rm_ind].push(j);
                }
            }
        }
        return rms_cls_schedule;
    }

    //Reutn an object, each key is room ind, each value is an object where key is class ind and value is an array of scheduling time
    function get_scheduled_tms(rms_cls_scheduled) {
        var rms_cls_tms_scheduled = [];
        for (var rm_ind in rms_cls_scheduled) {
            var cls_scheduled = rms_cls_scheduled[rm_ind];
            var j=0;
            while (j<cls_scheduled.length) {
                var k=0;
                var cls_ind = cls_scheduled[j];
                while (k<num_t_slots) {
                    if (flow_mat[cls_ind+connectorInd][k+timesInd]>0){
                        rms_cls_tms_scheduled.push({'cls_id':cls_ind, 'rm_id':rm_ind, 'tm_id':k});
                    }
                    k++;
                }
                j++;
            }
        }
        return rms_cls_tms_scheduled;
    }

    function display_results(schedule) {
        $('#tblResults').empty();
        var tbl_body = document.createElement("tbody");
        var odd_even = false;

        for (var i=0; i<schedule.length;i++) {
            var tbl_row = tbl_body.insertRow();
            tbl_row.className = odd_even ? "odd" : "even";
            var cell = tbl_row.insertCell();
            var cls_rm_tm = schedule[i];
            var rm_ind = cls_rm_tm['rm_id'];
            var cls_ind = cls_rm_tm['cls_id'];
            var tm_ind = cls_rm_tm['tm_id'];
            cell.appendChild(document.createTextNode(available_rooms[rm_ind]['rooms_shortname'] + available_rooms[rm_ind]['rooms_number'] +' '+Object.keys(courses_to_schedule)[cls_ind]+' '+times[tm_ind]));
            odd_even = !odd_even;
        }

        document.getElementById("tblResults").appendChild(tbl_body);
    }

    function calc_q_msre(){
        var sum_cse_scheduled = 0;
        for (var i=0; i<num_connector;i++) {
            var num_cse_scheduled = flow_mat[connectorInd+i];
            for (var j=0; j<num_nodes;j++) {
                if (num_cse_scheduled[j]>0) {
                    sum_cse_scheduled += num_cse_scheduled[j];
                }
            }
        }

        var tt_num_cses = 0
        for (var cse_id in courses_to_schedule) {
            tt_num_cses += courses_to_schedule[cse_id]['num_sec'];
        }
        document.getElementById('tblResults').append('quality measure:'+((tt_num_cses-sum_cse_scheduled)/tt_num_cses).toString());
    }

    function withinDist(room, b_lat, b_lon, req_dist) {
        var dist = getDistanceFromLatLonInKm(room['rooms_lat'], room['rooms_lon'], b_lat, b_lon);
        if (dist * 1000 <= req_dist) {
            return true;
        } else {
            return false;
        }
    }

    function getLatLon(b_name, rooms) {
        for (var i = 0; i < rooms.length; i++) {
            var room = rooms[i];
            if (room['rooms_shortname'] == b_name) {
                return {'lat': room['rooms_lat'], 'lon': room['rooms_lon']};
            }
        }
    }

    //code is copied from: http://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
    function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2 - lat1);  // deg2rad below
        var dLon = deg2rad(lon2 - lon1);
        var a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2)
            ;
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in km
        return d;
    }

    function deg2rad(deg) {
        return deg * (Math.PI / 180)
    }

    function getNeighbors(v) {
        var v_neighbors = [];
        var cap_v = cap_mat[v];
        for (var i = 0; i < num_nodes; i++) {
            if (cap_v[i] > 0) {
                v_neighbors.push(i);
            }
        }
        return v_neighbors;
    }
})