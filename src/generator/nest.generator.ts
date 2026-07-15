
import { ModelNode } from "../core_db/scylla.parser";
import * as fs from "fs-extra";

export async function generateModuleFiles(model: ModelNode) {
  const name = model.name.toLowerCase();
  const className = model.name;

  const dir = `src/modules/${name}`;
  await fs.ensureDir(dir);

  const pk = model.partitionKey[0];
  const ck = model.clusteringKey?.[0];

  /* ================= ZOD ================= */

  const zodFields = model.fields
    .map((f) => `${f.name}: z.any()`)
    .join(",\n  ");

  const schemaFile = `
import { z } from "zod";

export const create${className}Schema = z.object({
  ${zodFields}
});

export const update${className}Schema = create${className}Schema.partial();

export type Create${className}Dto = z.infer<typeof create${className}Schema>;
export type Update${className}Dto = z.infer<typeof update${className}Schema>;
`;

  /* ================= SERVICE ================= */

  const serviceFile = `
import { Injectable } from "@nestjs/common";
import { ${className}Repository } from "../../generated/${name}.repository";
import { Create${className}Dto, Update${className}Dto } from "./${name}.schema";

@Injectable()
export class ${className}Service {
  constructor(private readonly repo: ${className}Repository) {}

  async create(data: Create${className}Dto) {
    return this.repo.insert_one(data);
  }

  async findAll() {
    return this.repo.find_all();
  }

  async findOne(${pk}: string${ck ? `, ${ck}: string` : ""}) {
    return this.repo.find_one(${pk}${ck ? `, ${ck}` : ""});
  }

  async update(${pk}: string${ck ? `, ${ck}: string` : ""}, data: Update${className}Dto) {
    return this.repo.update_one(${pk}${ck ? `, ${ck}` : ""}, data);
  }

  async delete(${pk}: string${ck ? `, ${ck}: string` : ""}) {
    return this.repo.delete_one(${pk}${ck ? `, ${ck}` : ""});
  }
}
`;

  /* ================= CONTROLLER ================= */

  const controllerFile = `
import { Controller, Get, Post, Body, Param, Patch, Delete } from "@nestjs/common";
import { ${className}Service } from "./${name}.service";
import { create${className}Schema, update${className}Schema } from "./${name}.schema";

@Controller("${name}")
export class ${className}Controller {
  constructor(private readonly service: ${className}Service) {}

  @Post()
  create(@Body() body: any) {
    const data = create${className}Schema.parse(body);
    return this.service.create(data);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(":${pk}${ck ? `/:${ck}` : ""}")
  findOne(@Param("${pk}") ${pk}: string${ck ? `, @Param("${ck}") ${ck}: string` : ""}) {
    return this.service.findOne(${pk}${ck ? `, ${ck}` : ""});
  }

  @Patch(":${pk}${ck ? `/:${ck}` : ""}")
  update(
    @Param("${pk}") ${pk}: string${ck ? `, @Param("${ck}") ${ck}: string` : ""},
    @Body() body: any
  ) {
    const data = update${className}Schema.parse(body);
    return this.service.update(${pk}${ck ? `, ${ck}` : ""}, data);
  }

  @Delete(":${pk}${ck ? `/:${ck}` : ""}")
  delete(@Param("${pk}") ${pk}: string${ck ? `, @Param("${ck}") ${ck}: string` : ""}) {
    return this.service.delete(${pk}${ck ? `, ${ck}` : ""});
  }
}
`;

  /* ================= MODULE ================= */

  const moduleFile = `
import { Module } from "@nestjs/common";
import { ${className}Controller } from "./${name}.controller";
import { ${className}Service } from "./${name}.service";
import { ${className}Repository } from "../../generated/${name}.repository";

@Module({
  controllers: [${className}Controller],
  providers: [${className}Service, ${className}Repository],
})
export class ${className}Module {}
`;

  await fs.writeFile(`${dir}/${name}.schema.ts`, schemaFile);
  await fs.writeFile(`${dir}/${name}.service.ts`, serviceFile);
  await fs.writeFile(`${dir}/${name}.controller.ts`, controllerFile);
  await fs.writeFile(`${dir}/${name}.module.ts`, moduleFile);

  console.log(`✅ Generated ${className} module`);
}