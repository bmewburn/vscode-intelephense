var fs = require('fs');
fs.readdir('/home/ben/tmp', (err, files)=>{
			files.forEach((f)=>{
                console.log(f);
            });
		});