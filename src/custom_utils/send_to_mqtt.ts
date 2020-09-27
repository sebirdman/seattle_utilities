
export async function send_data_to_mqtt(meter: string, dailyConsumption: string) {
    const mqtt_payload = {
        meter,
        consumption: dailyConsumption,
    };

    var mqtt = require("mqtt");

    var client = mqtt.connect("mqtt://homeassistant.local:1883");

    client.on("connect", function () {
        client.subscribe("home/power", function (err: any) {
            if (!err) {
                client.publish("home/power", JSON.stringify(mqtt_payload));
            }
        });
    });

    client.on("message", function (topic: any, message: any) {
        // message is Buffer
        console.log(message.toString());
        client.end();
    });
}