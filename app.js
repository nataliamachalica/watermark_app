const Jimp = require('jimp');
const inquirer = require('inquirer');
const fs = require('fs');

const addTextWatermarkToImage = async function(inputFile, outputFile, text, action) {

	try {
    const rawImage = await Jimp.read(inputFile);
    const image = action ? action(rawImage) : rawImage;
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    const textData = {
			text: text,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
    };

    image.print(font, 0, 0, textData, image.getWidth(), image.getHeight());
    await image.quality(100).writeAsync(outputFile);
		console.log('Your file has been successfully created');
  }
	catch {
		console.log('Something went wrong. Your input is invalid');
	}
    startApp();
};

const addImageWatermarkToImage = async function(inputFile, outputFile, watermarkFile, action) {

	try {
    const rawImage = await Jimp.read(inputFile);
		const image = action ? action(rawImage) : rawImage;
    const watermark = await Jimp.read(watermarkFile);
    const x = image.getWidth() / 2 - watermark.getWidth() / 2;
    const y = image.getHeight() / 2 - watermark.getHeight() / 2;

		image.composite(watermark, x, y, {
		mode: Jimp.BLEND_SOURCE_OVER,
    opacitySource: 0.5,
    });

    await image.quality(100).writeAsync(outputFile);
    console.log('Your file has been successfully created');

  } catch {
		console.log('Something went wrong. Your input is invalid');
	}
    startApp();
};

const prepareOutputFilename = (filename) => {
	const [name, text] = filename.split('.');
	return `${name}-with-watermark.${text}`
};

const startApp = async () => {

	// Ask if user is ready
	const answer = await inquirer.prompt([{
		name: 'start',
		message: 'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you\'ll be able to use them in the app. Are you ready?',
		type: 'confirm'
	}]);

	// if answer is no, just quit the app
	if(!answer.start) process.exit();

	// ask about input image
	const inputImage = await inquirer.prompt([{
    name: 'inputImage',
    type: 'input',
    message: 'What file do you want to mark?',
    default: 'test.jpg',
	},
	{
	name: 'edit',
	type: 'confirm',
	message: 'Do you want to edit this file?',
	default: 'false',
	}]);

	// if yes ask about action

	let action;
	if (inputImage.edit) {
    const editOptions = await inquirer.prompt([{
      name: 'action',
      type: 'list',
      choices: ['Make image brighter', 'Increase contrast', 'Gray scale', 'Invert image'],
    }]);

		switch (editOptions.action) {
      case 'Make image brighter':
        action = image => image.brightness(0.5);
        break;
			case 'Increase contrast':
				action = image => image.contrast(0.5);
				break;
			case 'Gray scale':
				action = image => image.greyscale();
				break;
			case 'Invert image':
				action = image => image.invert();
				break;
      default:
        action = null;
		}
  }

    // ask about watermark type
    const options = await inquirer.prompt([{
		name: 'watermarkType',
		type: 'list',
		choices: ['Text watermark', 'Image watermark'],
	}]);

	const inputFilePath = './img/' + inputImage.inputImage;

	if(options.watermarkType === 'Text watermark') {
		const text = await inquirer.prompt([{
      name: 'value',
      type: 'input',
      message: 'Type your watermark text:',
		}]);
		options.watermarkText = text.value;

		if (fs.existsSync(inputFilePath)){
		addTextWatermarkToImage(inputFilePath, './img/' + prepareOutputFilename(inputImage.inputImage), options.watermarkText, action);
    } else
			console.log('Something went wrong');
	}

  else {
    const image = await inquirer.prompt([{
      name: 'filename',
      type: 'input',
      message: 'Type your watermark name:',
      default: 'logo.png',
    }]);
    options.watermarkImage = image.filename;

		const watermarkPath = './img/' + options.watermarkImage;

		if (fs.existsSync(inputFilePath) && fs.existsSync(watermarkPath)){
			addImageWatermarkToImage(inputFilePath, './img/' + prepareOutputFilename(inputImage.inputImage), watermarkPath, action);
		} else console.log('Something went wrong. Your input is invalid');
	}
};

startApp();