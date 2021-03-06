/**
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.wso2.ds.ui.integration.test.gadget;

import org.openqa.selenium.By;
import org.testng.annotations.*;
import org.wso2.carbon.automation.engine.context.TestUserMode;
import org.wso2.carbon.integration.common.utils.exceptions.AutomationUtilException;
import org.wso2.ds.ui.integration.util.DSUIIntegrationTest;

import javax.xml.xpath.XPathExpressionException;
import java.io.IOException;
import java.net.MalformedURLException;

import static org.testng.Assert.assertFalse;
import static org.testng.Assert.assertTrue;

/**
 * This is used to test the delete gadget functionality
 */
public class DeleteGadgetTest extends DSUIIntegrationTest {
    /**
     * Initializes the class.
     *
     * @param userMode user mode
     */
    @Factory(dataProvider = "userMode")
    public DeleteGadgetTest(TestUserMode userMode) {
        super(userMode);
    }

    /**
     * Provides user modes.
     *
     * @return user modes
     */
    @DataProvider(name = "userMode")
    public static Object[][] userModeProvider() {
        return new Object[][] { { TestUserMode.SUPER_TENANT_ADMIN } };
    }

    /**
     * Setup the testing environment.
     *
     * @throws XPathExpressionException
     * @throws IOException
     * @throws AutomationUtilException
     */
    @BeforeClass(alwaysRun = true)
    public void setUp() throws AutomationUtilException, XPathExpressionException, IOException {
        login(getCurrentUsername(), getCurrentPassword());
    }

    /**
     * Clean up after running tests.
     *
     * @throws XPathExpressionException
     * @throws MalformedURLException
     */
    @AfterClass(alwaysRun = true)
    public void tearDown() throws XPathExpressionException, MalformedURLException {
        logout();
        getDriver().quit();
    }

    /**
     * Delete a gadget from gadget listing page and check whether that gadget exists in that page.
     * Delete button of another gadget and click cancel button and check whether that gadget still exists.
     *
     * @throws MalformedURLException
     * @throws XPathExpressionException
     * @throws InterruptedException
     */
    @Test(groups = "wso2.ds.gadget", description = "Deleting a gadget in gadget listing page")
    public void testDeleteGadget() throws MalformedURLException, XPathExpressionException, InterruptedException {
        getDriver().get(getBaseUrl() + "/portal/gadget/");
        getDriver().findElement(By.cssSelector("#usa-social > a.ds-asset-trash-handle")).click();
        getDriver().findElement(By.cssSelector("span.ladda-label")).click();
        Thread.sleep(3000);
        assertFalse(getDriver().isElementPresent(By.cssSelector("#usa-social")), "Gadget is not deleted");
        getDriver().findElement(By.cssSelector("#usa-business-revenue > a.ds-asset-trash-handle")).click();
        getDriver().findElement(By.cssSelector("a.btn.btn-default.ds-asset-trash-cancel")).click();
        assertTrue(getDriver().isElementPresent(By.cssSelector("#usa-business-revenue")),
                "Gadget is deleted without confirm");
    }
}
