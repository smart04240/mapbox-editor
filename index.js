(function () {
  document.querySelector('#map').addEventListener('click', function (e) {
    var target = e.target;

    var isClickedSave = typeof target.className === 'string' && target.className.includes('btn-save');
    if (isClickedSave) {
      save(e);
      return;
    }

    if (isDeleteMode) {
      document.querySelector('.leaflet-pane.leaflet-popup-pane').style.display = 'none';
    } else {
      document.querySelector('.leaflet-pane.leaflet-popup-pane').style.display = 'block';
    }
    var isClickedLayer = target.tagName.toLowerCase() === 'path' && target.classList.value.includes('leaflet-interactive');

    if (isDeleteMode && isClickedLayer) {
      target.remove();
      return;
    }
  });

  var states = [];
  var isDeleteMode = false;
  L.mapbox.accessToken = 'pk.eyJ1IjoibW9ua2V5dGlnZXIiLCJhIjoiY2tta3oxZWlxMDExeDJ1cXNwa3JybGE4NyJ9.JvlglXJfRZbapyK-egLKuw';
  var map = L.mapbox.map('map')
    .setView([38.89399, -77.03659], 3)
    .addLayer(L.mapbox.styleLayer('mapbox://styles/mapbox/streets-v11'));

  var featureGroup = L.featureGroup().addTo(map);
  var drawControl = new L.Control.Draw({
    edit: {
      featureGroup: featureGroup
    },
    draw: {
      marker: false,
      circlemarker: false
    }
  }).addTo(map);

  map.on('draw:created', function (e) {
    var color = getRandomColor();
    var id = new Date().getTime();
    var layer = e.layer;
    var layerType = e.layerType;
    var geoJsonObj = layer.toGeoJSON();

    if (layerType === 'circle') {
      geoJsonObj.properties.radius = layer.getRadius();
    }

    geoJsonObj.properties.color = color;
    geoJsonObj.properties.id = id;
    geoJsonObj.properties.name = '';
    states.push(geoJsonObj);

    drawByGeoJson(states);
  });

  map.on('draw:edited', function (e) {
    var layers = e.layers;
    layers.eachLayer(function (layer) {
      var feature = layer.feature;
      var index = findLayerIndexById(feature.properties.id);
      var geoJsonObj = layer.toGeoJSON();

      if (layer.defaultOptions.radius) {
        var radius = layer.getRadius();
        geoJsonObj.properties.radius = radius;
      }

      states[index] = geoJsonObj;
    });
  });

  map.on('draw:deletestart', function () {
    isDeleteMode = true;
  });

  map.on('draw:deletestop', function () {
    isDeleteMode = false;
    drawByGeoJson(states);
  });

  map.on('draw:deleted', function (e) {
    var layers = e.layers;
    layers.eachLayer(function (layer) {
      var feature = layer.feature;
      var index = findLayerIndexById(feature.properties.id);
      states.splice(index, 1);
    });

    isDeleteMode = false;
    drawByGeoJson(states);
  });

  function getRandomColor() {
    var randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
    return randomColor;
  }

  function drawByGeoJson(states) {
    isDeleteMode = false;
    removeAllLayers();
    L.geoJSON(states, {
      pointToLayer: function (feature, latlng) {
        if (feature.properties.radius) {
          return new L.Circle(latlng, feature.properties.radius);
        }
        return;
      },
      style: function (feature) {
        var obj = { color: feature.properties.color };
        obj = { ...obj, strokeWeight: feature.properties.radius };
        return obj;
      },
      onEachFeature: function (feature, layer) {
        var content = `<label>Name: </label><input class="popup-input" value="${feature.properties.name}" /><button class="btn-save" data-id="${feature.properties.id}">Save</button>`;
        layer.bindPopup(content);

        featureGroup.addLayer(layer);
      }
    }).addTo(map);
  }

  function save(e) {
    var target = e.target;
    var targetId = target.dataset.id;
    var inputedText = target.previousSibling.value;
    var targetStateIndex = states.findIndex(function (state) {
      return Number(state.properties.id) === Number(targetId);
    });
    var originalName = states[targetStateIndex].properties.name;
    states[targetStateIndex].properties.name = inputedText;
    var targetState = states[targetStateIndex];

    states.forEach(function (state) {
      if (state.properties.name !== '' && state.properties.name === targetState.properties.name) {
        state.properties.color = targetState.properties.color;
      }

      if (originalName !== '' && originalName === state.properties.name) {
        states[targetStateIndex].properties.color = getRandomColor();
      }
    });

    drawByGeoJson(states);
  }

  function removeAllLayers() {
    map.closePopup();
    map.removeLayer(featureGroup);
    var layerElem = document.querySelector('path.leaflet-interactive');

    if (layerElem) {
      layerElem.parentElement.innerHTML = '';
    }
  }

  function findLayerIndexById(id) {
    var index = states.findIndex(function (state) {
      return Number(id) === Number(state.properties.id);
    });

    return index;
  }
})();