package kafka

import (
	"log"
	"os"

	ckafka "github.com/confluentinc/confluent-kafka-go/kafka"
)

func NewKafkaProducer() *ckafka.Producer {
    configMap := &ckafka.ConfigMap{
        "bootstrap.servers": os.Getenv("KafkaBootstrapServers"),
        // "security.protocol": os.Getenv("security.protocol"),
		// "sasl.mechanisms":   os.Getenv("sasl.mechanisms"),
		// "sasl.username":     os.Getenv("sasl.username"),
		// "sasl.password":     os.Getenv("sasl.password"),
    }
    log.Printf("Bootstrap servers: %s", os.Getenv("KafkaBootstrapServers"))
    p, err := ckafka.NewProducer(configMap)
    if err != nil {
        log.Fatalf("Failed to create producer: %v", err)
    }
    return p
}

func Publish(msg string, topic string, producer *ckafka.Producer) error {
    message := &ckafka.Message{
        TopicPartition: ckafka.TopicPartition{Topic: &topic, Partition: ckafka.PartitionAny},
        Value:          []byte(msg),
    }
    err := producer.Produce(message, nil)
    if err != nil {
        log.Printf("Failed to produce message: %v", err)
        return err
    }
    log.Printf("Message produced: %s", msg)
    return nil
}