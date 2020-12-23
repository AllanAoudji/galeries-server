import request from 'supertest';

import initApp from '@src/server';

interface User {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const newUser: User = {
  userName: 'user',
  email: 'user@email.com',
  password: 'Aaoudjiuvhds9!',
  confirmPassword: 'Aaoudjiuvhds9!',
};

const sendPostRequest = async (user: User) => request(initApp()).post('/users').send(user);
describe('users', () => {
  describe('POST', () => {
    let response: request.Response;

    beforeEach(async () => {
      response = await sendPostRequest(newUser);
    });

    it('should return 200', () => {
      const { status } = response;
      expect(status).toBe(200);
    });

    it('should return a user from get', () => {
      const { body } = response;
      expect(body).toEqual({
        id: 0,
        userName: newUser.userName,
        email: newUser.email,
        password: newUser.password,
      });
    });

    it('should have one user after posting', async () => {
      const { body } = await request(initApp()).get('/users');
      console.log(body);
      expect(body.length).toBe(1);
    });

    it('should have two users after posting twice', async () => {
      const { body } = await request(initApp()).get('/users');
      expect(body.length).toBe(2);
    });

    describe('should return 400', () => {
      describe('if username', () => {
        const newUserWithEmptyUserName: User = { ...newUser, userName: '' };
        const newUserWithUserNameWithSpaces: User = { ...newUser, userName: 'Allan Aoudji' };
        const newUserWithUserNameLessThanThree: User = { ...newUser, userName: 'ab' };
        const newUserWithUserNameMoreThanThirty: User = { ...newUser, userName: 'a'.repeat(31) };

        it('is empty', async () => {
          const { status } = await sendPostRequest(newUserWithEmptyUserName);
          expect(status).toBe(400);
        });
        it('contain spaces', async () => {
          const { status } = await sendPostRequest(newUserWithUserNameWithSpaces);
          expect(status).toBe(400);
        });
        it('is less than 3 chars', async () => {
          const { status } = await sendPostRequest(newUserWithUserNameLessThanThree);
          expect(status).toBe(400);
        });
        it('is less than 30 chars', async () => {
          const { status } = await sendPostRequest(newUserWithUserNameMoreThanThirty);
          expect(status).toBe(400);
        });
      });
      describe('if email', () => {
        const newUserWithEmptyEmail: User = { ...newUser, email: '' };
        const newUserWithEmailNotValid: User = { ...newUser, email: 'notValid' };

        it('is empty', async () => {
          const { status } = await sendPostRequest(newUserWithEmptyEmail);
          expect(status).toBe(400);
        });
        it('is not valid', async () => {
          const { status } = await sendPostRequest(newUserWithEmailNotValid);
          expect(status).toBe(400);
        });
      });
      describe('if password', () => {
        const passwordLessThanHeightChar = 'Abc9!';
        const passwordMoreThanThirtyChar = `Ac9!${'a'.repeat(31)}`;
        const passwordWithoutUppercase = 'aaoudjiuvhds9!';
        const passwordWithoutLowercase = 'AAOUDJIUVHDS9!';
        const passwordWithoutNumber = 'Aaoudjiuvhds!';
        const passwordWithoutSpecialChar = 'Aaoudjiuvhds9';

        const newUserWithEmptyPassword: User = { ...newUser, password: '' };
        const newUserWithPasswordLessThanHeightChars: User = {
          ...newUser,
          password: passwordLessThanHeightChar,
          confirmPassword: passwordLessThanHeightChar,
        };
        const newUserWithPasswordWithoutLowercase: User = {
          ...newUser,
          password: passwordWithoutLowercase,
          confirmPassword: passwordWithoutLowercase,
        };
        const newUserWithPasswordMoreThanThirtyChars: User = {
          ...newUser,
          password: passwordMoreThanThirtyChar,
          confirmPassword: passwordMoreThanThirtyChar,
        };
        const newUserWithPasswordWithoutNumber: User = {
          ...newUser,
          password: passwordWithoutNumber,
          confirmPassword: passwordWithoutNumber,
        };
        const newUserWithPasswordWithoutChar: User = {
          ...newUser,
          password: passwordWithoutSpecialChar,
          confirmPassword: passwordWithoutSpecialChar,
        };
        const newUserWithPasswordWithoutUppercase: User = {
          ...newUser,
          password: passwordWithoutUppercase,
          confirmPassword: passwordWithoutUppercase,
        };

        it('is empty', async () => {
          const { status } = await sendPostRequest(newUserWithEmptyPassword);
          expect(status).toBe(400);
        });
        it('contain less than 8 chars', async () => {
          const { status } = await sendPostRequest(newUserWithPasswordLessThanHeightChars);
          expect(status).toBe(400);
        });
        it('contain more than 30 chars', async () => {
          const { status } = await sendPostRequest(newUserWithPasswordMoreThanThirtyChars);
          expect(status).toBe(400);
        });
        it('doesn\'t contain any uppercase', async () => {
          const { status } = await sendPostRequest(newUserWithPasswordWithoutUppercase);
          expect(status).toBe(400);
        });
        it('doesn\'t contain any lowercase', async () => {
          const { status } = await sendPostRequest(newUserWithPasswordWithoutLowercase);
          expect(status).toBe(400);
        });
        it('doesn\'t contain any number', async () => {
          const { status } = await sendPostRequest(newUserWithPasswordWithoutNumber);
          expect(status).toBe(400);
        });
        it('doesn\'t contain any special char', async () => {
          const { status } = await sendPostRequest(newUserWithPasswordWithoutChar);
          expect(status).toBe(400);
        });
      });
      describe('if confirmPassword', () => {
        const newUserWithEmptyConfirmPassword: User = { ...newUser, confirmPassword: '' };
        const newUserWithPasswordsNotMatch: User = { ...newUser, confirmPassword: 'passwor' };
        it('is empty', async () => {
          const { status } = await sendPostRequest(newUserWithEmptyConfirmPassword);
          expect(status).toBe(400);
        });
        it('and password not match', async () => {
          const { status } = await sendPostRequest(newUserWithPasswordsNotMatch);
          expect(status).toBe(400);
        });
      });
    });
  });
});
