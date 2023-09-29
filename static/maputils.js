$(document).ready(function() {

  function initializeMap() {

    // bounds of map (full globe)
    // **************************
    let bounds = [
      [-90.0, -180.0],
      [90.0, 180.0]
    ];

    // create leaflet map object
    // *************************
    var map = L.map("map", {
      center: [40.0, 0.0],
      attributionControl: false,
      preferCanvas: true,
      zoom: 2.0,
      maxBounds: bounds
    });

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
      maxZoom: 6,
    }).addTo(map);
    return map;
  }

  function render_netcdf_data(netcdf_full_path_s3_bucket, leaflet_map) {
    $.ajax({
      type: "POST",
      url: "/get_netcdf_variable",
      cache: false,
      async: true,
      timeout: 20000, // timeout is 20 seconds to retrieve data
      contentType: "application/json",
      dataType: 'json',
      data: JSON.stringify({
        netcdf_path : netcdf_full_path_s3_bucket
      }),
      success: function(response) {
        render_netcdf_variable(leaflet_map, response);
      },
      error: function(request, error) {
        console.log(error.toString());
      }
    });
  }

  function render_netcdf_variable(mapob, netcdf_json_response) {

    // get the json response from get_netcdf_variable() function (see app.py)
    // and split along the comma character, cast each element to float
    // **********************************************************************
    let lats = netcdf_json_response.lats.split(",").map(Number);
    let lngs = netcdf_json_response.lngs.split(",").map(Number);
    let arr = netcdf_json_response.temps.split(",").map(Number);
    let min = parseFloat(netcdf_json_response.min);
    let max = parseFloat(netcdf_json_response.max);  
 
    let circle_polygons = [];
    let thresholds = [
      210.0, 225.0, 230.0, 235.0, 240.0, 245.0, 250.0, 255.0, 260.0];
    let colors = ["#000080", "#0000FF", "#00FFFF","#00FF00", "#FFFF00", "#FFA500", "#FF0000", "#FF00FF"]; 
 
    // iterate through each point in the variable
    // ******************************************
    for(let poly_counter = 0; poly_counter < arr.length; poly_counter++) {
   
      // get center of pixel point and color for point using thresholds
      // ************************************************************** 
      let circleCenter = [lats[poly_counter], lngs[poly_counter]];
      let circle_color = get_color_for_pixel(arr[poly_counter], arr, colors, thresholds);
      if(arr[poly_counter] == 0.0) { continue; }
 
      // define display options for pixel point on map
      // *********************************************
      let circleOptions = 
      {
        color: circle_color,
        fillColor: circle_color,
        fillOpacity: 1.0
      }

      // create Leaflet circle point
      // ***************************
      var circle = L.circle(circleCenter, 5, circleOptions);
      circle_polygons.push(circle);
    }
    
    // add point group to the map
    // **************************
    let circlesLayer = L.layerGroup(circle_polygons);
    circlesLayer.addTo(mapob);
  }

  function get_color_for_pixel(value, all_values, colors, threshes) {
    if( value < threshes[0] ) {
      return colors[0]; // navy
    } else if( value >= threshes[0] && value < threshes[1] ) {
      return colors[1]; // blue
    } else if( value >= threshes[1] && value < threshes[2] ) {
      return colors[2]; // cyan/aqua
    } else if( value >= threshes[2] && value < threshes[3] ) {
      return colors[3]; // lime
    } else if( value >= threshes[3] && value < threshes[4] ) {
      return colors[4]; // yellow
    } else if( value >= threshes[4] && value < threshes[5] ) {
      return colors[5]; // orange
    } else if( value >= threshes[5] && value < threshes[6] ) {
      return colors[6]; // red
    } else if( value >= threshes[6] && value < threshes[7] ) {
      return colors[7]; // dark red
    } else {
      return colors[8]; // magenta
    }
  }
 
  var netcdf_s3 = 's3://netcdfs/OR-ABI-L2-CSRF-M6_v2r2_G18_s202309261820219_e202309261829528_c202309261832401.nc';
  var map = initializeMap();
  render_netcdf_data(netcdf_s3, map);

});
