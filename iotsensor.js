const mongoose = require('mongoose');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const plotly = require('plotly')('ayush_som', 'ov1Jnvra5Y6mlYlWJ0Pz');
const Sensor = require('./models/sensor');

const COMMPORT = '/dev/cu.usbmodem1101';

const port = new SerialPort({ path: `${COMMPORT}`, baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

const uri = 'mongodb+srv://user:hello@cluster4.b23y2li.mongodb.net/';

const plotlyData = {
  x: [],
  y: [],
  type: 'scatter',
};

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    setInterval(sensortest, 10000);
  })
  .catch(error => {
    console.error('MongoDB connection error:', error);
  });

const data = {
  x: [],
  y: [],
  type: 'scatter',
};

function sensortest() {
  const starttime = Date.now();

  const sensordata = {
    id: 0,
    name: 'temperaturesensor',
    address: '221 Burwood Hwy, Burwood VIC 3125',
    data: [
      {
        time: Date.now(),
        temperature: 20.00,
      },
    ],
  };

  console.log(JSON.stringify(sensordata));

  parser.on('data', data => {
    sensordata.data.push({
      time: Date.now(),
      temperature: parseFloat(data),
    });

    console.log(sensordata.data[sensordata.data.length - 1].temperature);

    plotlyData.x.push(new Date().toISOString());
    plotlyData.y.push(sensordata.data[sensordata.data.length - 1].temperature);

    const graphOptions = {
      filename: 'iot-performance',
      fileopt: 'overwrite',
    };
    plotly.plot(plotlyData, graphOptions, function (err, msg) {
      if (err) return console.log(err);
      console.log(msg);
    });

    Sensor.findOneAndUpdate(
      { id: sensordata.id },
      { $push: { data: sensordata.data[sensordata.data.length - 1] } },
      { new: true, upsert: true }
    )
      .then(doc => {
        console.log(doc);
      })
      .catch(error => {
        console.error(error);
      });
  });

  mongoose.connect('mongodb+srv://user:hello@sit314.6bgmark.mongodb.net/', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => {
    const low = 10;
    const high = 40;
    const reading = Math.floor(Math.random() * (high - low) + low);
    sensordata.data[0].temperature = reading;

    const jsonString = JSON.stringify(sensordata);
    console.log(jsonString);

    const newSensor = new Sensor({
      id: sensordata.id,
      name: sensordata.name,
      address: sensordata.address,
      time: sensordata.data[0].time,
      temperature: sensordata.data[0].temperature,
    });

    newSensor.save().then(doc => {
      console.log(doc);
    }).then(() => {
      const time = Date.now();
      data.x.push(new Date().toISOString());
      data.y.push(time);
      const graphOptions = {
        filename: 'iot-performance',
        fileopt: 'overwrite',
      };
      plotly.plot(data, graphOptions, function (err, msg) {
        if (err) return console.log(err);
        console.log(msg);
      });

      mongoose.connection.close();
    });
  }).catch(error => {
    console.error('Error connecting to MongoDB:', error);
  });
}