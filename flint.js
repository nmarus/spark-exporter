var sequence = require('when/sequence');
var moment = require('moment');
var util = require('util');
var path = require('path');
var when = require('when');
var fs = require('fs');
var _ = require('lodash');

var csv = 'DATE, ROOM_TITLE, EMAIL, DISPLAY_NAME, MESSAGE\n';
// write output file...
fs.appendFileSync('export/spark_messages.csv', csv, { encoding: 'utf8'});

module.exports = function(flint) {

  flint.on('spawn', bot => {
    console.log('Tagged room "%s" for export...', bot.room.title);
  });

  flint.on('initialized', () => {

    console.log(' --------------------------------------------------------------------- ');
    console.log('| Spark Account Export Starting...  This can take a VERY long time... |');
    console.log('| Do not exit until you see a notification that export is complete!   |');
    console.log(' --------------------------------------------------------------------- ');

    // create batch
    var batch = _.map(flint.bots, bot => {
      return () => {

        console.log('Scanning room "%s" for export...', bot.room.title);

        return bot.getMessages()
          .then(messages => {
            console.log('Exporting %s messages from room "%s"!', messages.length, bot.room.title)
            return when.map(messages, message => {

              if(message.text) {
                var line = util.format('%s, "%s", %s, "%s", "%s"\n',
                  moment(message.created).format('YYYY-MM-DD HH:mm:ss'),
                  bot.room.title.replace(/[",]/g, ' '),
                  message.personEmail,
                  message.personDisplayName.replace(/[",]/g, ' '),
                  message.text.replace(/[",]/g, ' '));
                // write output file...
                fs.appendFileSync('export/spark_messages.csv', line, { encoding: 'utf8'});
              }

              if(message.files && message.files.length > 0) {
                return flint.parseFile(message)
                  .then(message => {
                    return when.map(message.files, file => {
                      var fileName = moment(message.created).format('YYYY_MM_DD_HHmmss_') + file.name;
                      console.log('Saving file "%s" from room "%s"!', file.name, bot.room.title);
                      fs.writeFileSync('export/files/' + fileName, file.binary, { encoding: null});
                      return when(true);
                    });
                  })
                  .catch(err => {
                    console.log(err.message);
                    return when(true);
                  });
              } else {
                return when(true);
              }
            })
            .catch(err => {
              console.log(err.message);
              return when(true);
            });
          })
          .catch(err => {
            console.log(err.message);
            return when(true);
          });
      };
    });

    // run batch
    sequence(batch).then(() => {
      console.log(' --------------------------------------------- ');
      console.log('| Done! See directory "export" for your data  |');
      console.log('| You can now press ctrl-c to quit...         |');
      console.log(' --------------------------------------------- ');
    });
  });
};
