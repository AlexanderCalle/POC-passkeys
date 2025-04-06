import express from 'express';

const router = express.Router();

router.post('/api/generate-registration-options', async (req, res) => {
    try {
      const { email } = req.body;
      const prismaUser = await prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      if (!prismaUser) {
        return res.status(404).json({ error: 'User not found' });
      } else {
        const user = {
          id: prismaUser.id,
          username: prismaUser.name,
          email: prismaUser.email,
          devices: [],
      };

      let opts = {
              rpName: rpName,
              rpID,
              userName: user.username,
              timeout: 60000,
              attestationType: 'none',
              excludeCredentials: user.devices.map((dev) => ({
                  id: dev.credentialID,
                  type: 'public-key',
                  transports: dev.transports,
              })),
              authenticatorSelection: {
                  residentKey: 'discouraged',
                  userVerification: 'preferred',
              },
              supportedAlgorithmIDs: [-7, -257],
          }

          const options = await generateRegistrationOptions(opts);
          req.session.currentChallenge = options.challenge;
          req.session.webAuthnUserID = options.user.id;
          res.send(options);
      }
    } catch (error) {
      res.status(400).send({ error: error.message });
    }
});