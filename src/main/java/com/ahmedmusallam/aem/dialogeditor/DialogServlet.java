package com.ahmedmusallam.aem.dialogeditor;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import javax.servlet.Servlet;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.HttpConstants;
import org.apache.sling.api.servlets.ServletResolverConstants;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.osgi.service.component.annotations.Component;

/**
 * @link http://[host]:[port]/content/we-retail/us/en.document-view.xml
 */
@Component(
  service = Servlet.class,
  property = {
    ServletResolverConstants.SLING_SERVLET_METHODS + "=" + HttpConstants.METHOD_POST,
    ServletResolverConstants.SLING_SERVLET_METHODS + "=" + HttpConstants.METHOD_GET,
    ServletResolverConstants.SLING_SERVLET_EXTENSIONS + "=json",
    ServletResolverConstants.SLING_SERVLET_SELECTORS + "=dialog",
    ServletResolverConstants.SLING_SERVLET_RESOURCE_TYPES + "=apps/dialogeditor"
  }
)
public class DialogServlet extends SlingAllMethodsServlet {

  private static final String CQ_DIALOG = "cq:dialog";
  private static final Gson gson = new Gson();



  @Override
  protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response)
    throws IOException {
    String dialogPath = request.getRequestPathInfo().getSuffix();



    response.setContentType("application/json");

    if (StringUtils.isBlank(dialogPath)) {
      sendBadRequest(response, "Dialog Path (suffix) must not be empty");
      return;
    }

    ResourceResolver resourceResolver = request.getResourceResolver();
    Resource dialogResource = resourceResolver.getResource(dialogPath);

    if (null == dialogResource) {
      sendBadRequest(response, "Provided path:" + dialogPath + "does not exist.");
      return;
    }

    String dialogNodeName = dialogResource.getName();

    if (!CQ_DIALOG.equals(dialogNodeName)) {
      sendBadRequest(response, "Dialog Path (suffix) Node name must be cq:dialog, but was " + dialogNodeName);
      return;
    }

    Resource componentResource = dialogResource.getParent();


    JsonObject json = new JsonObject();
    JsonElement componentAncestorPaths = gson.toJsonTree(getAncestorPaths(new ArrayList(), componentResource));
    json.add("dialogAncestorPaths", componentAncestorPaths);
    response.getWriter().write(json.toString());
  }

  private List<String> getAncestorPaths(List ancestorPaths, Resource componentResource) {
    if (null == componentResource) {
      return ancestorPaths;
    } else {
      Optional.ofNullable(componentResource.getChild(CQ_DIALOG))
        .map(Resource::getPath)
        .ifPresent(ancestorPaths::add);
      if (ancestorPaths.isEmpty()) {
        return getAncestorPaths(ancestorPaths, componentResource);
      } else {
        Resource superResource = getSuperResource(componentResource);
        return getAncestorPaths(ancestorPaths, superResource);
      }
    }
  }

  private Resource getSuperResource(Resource resource) {
    if (null == resource) {
      return null;
    } else {
      ResourceResolver resourceResolver = resource.getResourceResolver();
      String superType = resourceResolver.getParentResourceType(resource);
      return resourceResolver.getResource(superType);
    }
  }

  private void sendBadRequest(HttpServletResponse response, String errorString) throws IOException {
    JsonObject json = new JsonObject();
    json.addProperty("error", errorString);
    response.sendError(SlingHttpServletResponse.SC_BAD_REQUEST, json.toString());
  }

  @Override
  protected void doPost(SlingHttpServletRequest request, SlingHttpServletResponse response)
    throws IOException {
    
  }
}
