package com.project.order.infrastructure.persistence.entity.converter;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Serializa o Object "cru" (gatewayRawResponse) como texto JSON numa coluna
 * @Lob. Não é um requisito de negócio sofisticado — é só o jeito mais curto
 * de guardar "qualquer coisa que o gateway devolveu" sem criar uma tabela
 * própria pra isso.
 */
@Converter
public class JsonObjectConverter implements AttributeConverter<Object, String> {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(Object attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(attribute);
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public Object convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(dbData, Object.class);
        } catch (Exception e) {
            return dbData;
        }
    }
}
