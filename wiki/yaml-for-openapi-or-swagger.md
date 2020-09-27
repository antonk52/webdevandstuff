---
tags: [openapi, swagger, yaml, json]
---

# Why Yaml is a bad choice for handwritten openapi/swagger schemas

I've heard many people praise yaml as a supperior format to write openapi/swagger schemas by hand. One point they tend to repeat is that yaml supports comments unlike json. I find this argument rather odd since if you have a tricky schema that requires you to add a comment, it should be preffered to note this tricky part in `summary`, `description` or `x-*` field so the API consumers can be aware of this trickery without having to look into the raw schema sources.
