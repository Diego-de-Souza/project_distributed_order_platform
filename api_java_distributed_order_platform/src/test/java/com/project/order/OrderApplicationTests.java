package com.project.order;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
// ponytail: desabilitado até existir datasource de teste (H2/Testcontainers) quando
// a camada de infraestrutura/JPA for implementada - hoje sobe o contexto inteiro e
// quebra tentando resolver o dialect do Hibernate sem conexão nenhuma.
@Disabled("Sem datasource de teste ate a camada de infraestrutura (JPA) ser implementada")
class OrderApplicationTests {

	@Test
	void contextLoads() {
	}

}
