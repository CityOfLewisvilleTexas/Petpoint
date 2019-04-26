"use strict";
const refresh = () => {
  setTimeout(() => {
    window.location.reload()
}, 5000
  )}

let app = new Vue({
  el: '#app',
  data: {
    fileDropped: false,
    reports: ['Medical Exam Surgery Extended', 'Animal Intake With Results Extended'],
    selectedReport: '',
    json: '',
    workbook: '',
    state: {
      tickets: [{ name: "File Output:" }],
      headers: ["Petpoint"]
    },
    title: 'Petpoint Data',
    isLoading: {
      data: false
    },
    errorMessage: '',
    isError: false,
    snackbar: {
      show: false,
      text: '',
      color: 'success',
      timeout: 5000
    },
  },
  methods: {
    refresh: refresh,

    handleDrop: function (e) {
      this.isLoading = true
      let that = this
      e.stopPropagation();
      e.preventDefault();
      this.fileDropped = true
      console.log('file has dropped')
      var files = e.dataTransfer.files, i, f;
      for (i = 0, f = files[i]; i != files.length; ++i) {
        var reader = new FileReader(),
          name = f.name;
        reader.onload = function (e) {
          var results,
            data = e.target.result,
            fixedData = that.fixData(data),
            workbook = XLSX.read(btoa(fixedData), { type: 'base64' }),
            firstSheetName = workbook.SheetNames[0],
            worksheet = workbook.Sheets[firstSheetName];
          that.state.headers = that.getHeaderRow(worksheet);
          results = XLSX.utils.sheet_to_json(worksheet);
          that.state.tickets = results;
          that.json = that.workbook_to_json(workbook)
          console.log(that.json)
        };
        reader.readAsArrayBuffer(f);
      }
    },

    handleDragover: function (e) {
      e.stopPropagation();
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    },

    getHeaderRow: function (sheet) {
      var headers = [], range = XLSX.utils.decode_range(sheet['!ref']);
      var C, R = range.s.r; /* start in the first row */
      for (C = range.s.c; C <= range.e.c; ++C) { /* walk every column in the range */
        var cell = sheet[XLSX.utils.encode_cell({ c: C, r: R })] /* find the cell in the first row */
        var hdr = "UNKNOWN " + C; // <-- replace with your desired default 
        if (cell && cell.t) hdr = XLSX.utils.format_cell(cell);
        headers.push(hdr);
      }
      return headers;
    },

    fixData: function (data) {
      var o = "", l = 0, w = 10240;
      for (; l < data.byteLength / w; ++l) o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w, l * w + w)));
      o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w)));
      return o;
    },

    workbook_to_json: function (workbook) {
      var result = {};
      workbook.SheetNames.forEach(function (sheetName) {
        var roa = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
        if (roa.length > 0) {
          result[sheetName] = roa;
        }
      });
      return result[workbook.SheetNames[0]];
    },
    
    postData: function(service) {
        let stringedData = JSON.stringify(this.json)
        let that = this
 //Animal Intake With Results Extended
        axios.post('http://query.cityoflewisville.com/v2/',
          {
            webservice: `Petpoint/Report/${service}`,
            json: stringedData
          }
        )
        .then(function(response) {
          console.log(response)
          that.snackbar = {
            show: true,
            text: `Your report was successfully loaded`,
            timeout: 5000,
            color: 'success'
        }
          that.refresh()
        })
        .catch(function(err) {
          console.log('There was an error: ', err)
          that.snackbar = {
            show: true,
            text: `Yikes! There was an error: ${err}`,
            timeout: 10000,
            color: 'danger'
        }
        });
    }
  },

  mounted: function () {
    
  },
  created() {

  },
})