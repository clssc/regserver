// Script-as-app template.
function doGet() {
  var app = UiApp.createApplication();

  var static1 = app.createLabel('Enter full name (English or Chinese) of any family member:');
  addElement(app, static1, "label");
  var textBox1 = app.createTextBox().setName('name');
  addElement(app, textBox1, "textbox");
  var findButton = app.createButton('Find');
  addElement(app, findButton, "button");
  
  var label = app.createLabel('').setId('statusLabel');
  label.setVisible(false);
  addElement(app, label, "statusLabel");
  
  var findHandler = app.createServerHandler('onFind');
  findHandler.addCallbackElement(textBox1);
  findButton.addClickHandler(findHandler);

  return app;
}

function addElement(app, element, style) {
  app.add(element);
  applyStyles(element, style);
}

function applyStyles(element, style) {
  var appStyles = {
    "label": {
      "fontSize": "1.1em",
      "padding": "5px 5px 5px 5px"
    },
    "textbox": {
      "fontSize": "1.1em",
      "padding": "3px 3px 3px 3px"
    },
    "button": {
      "fontWeight": "bold"
    },
    "statusLabel": {
      "fontSize": "1.5em",
      "backgroundColor": "#ccc",
      "padding": "5px 5px 5px 5px",
      "fontWeight": "bold"
    }
  };
  
  if (!element.setStyleAttribute || !(style in appStyles)) return element;
  for (var attribute in appStyles[style]) {
    element.setStyleAttribute(attribute, appStyles[style][attribute]);
  }
  return element;
}

function getFamilyNumber(name) {
  var fn = new Reg.FamilyNumberLookup();
  return fn.lookup(name);
}
      
function onFind(eventInfo) {
  var app = UiApp.getActiveApplication();

  var label = app.getElementById('statusLabel');
  label.setVisible(true);
  var name = eventInfo.parameter.name;
  var familyNumber = getFamilyNumber(name);
  if (familyNumber == -1) {
    label.setText('Family number for ' + name + ' not found');
  } else {
    label.setText('Family number for ' + name + ' is ' + familyNumber);
  }
  
  return app;
}

function testFind() {
  Logger.log(getFamilyNumber('Rebecca Hsu'));
  Logger.log(getFamilyNumber('李小強'));
}

